/**
 * Connection Controller — Enhanced with Real-time Notifications
 *
 * FLOW:
 * 1. User A sends request → DB saves → Notification created → Socket emits to User B
 * 2. User B accepts/rejects → DB updates → Notification created → Socket emits to User A
 *
 * KEY DESIGN DECISION: We access the Socket.IO instance via require("../server").
 * This works because Node.js module caching ensures the same instance is returned.
 * Alternative approaches (dependency injection, global) add complexity without benefit
 * at this scale.
 */

const ConnectionRequest = require("../models/ConnectionRequest");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Helper: Create notification and emit via Socket.IO
 * Centralizes the persist-then-broadcast pattern to avoid duplication.
 *
 * @param {Object} params - { recipientId, senderId, type, message, relatedId, io }
 * @returns {Object} The created notification (populated with sender info)
 */
const createAndEmitNotification = async ({ recipientId, senderId, type, message, relatedId, io }) => {
  // 1. Persist to DB
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    message,
    relatedId,
  });

  // 2. Populate sender info for the Socket.IO payload
  //    (so the client doesn't need a separate API call to show sender name/avatar)
  const populated = await Notification.findById(notification._id)
    .populate("sender", "name username profilePic")
    .lean();

  // 3. Emit to the recipient's personal room
  //    Room name convention: "user:<userId>"
  if (io) {
    io.to(`user:${recipientId}`).emit("notification", populated);
  }

  return populated;
};

/**
 * POST /api/connections
 * Send a connection request
 */
const sendRequest = async (req, res) => {
  try {
    const { to, level } = req.body;

    // Prevent self-connection
    if (String(to) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    // Verify target user exists
    const targetUser = await User.findById(to).select("name username");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing request (either direction)
    const existing = await ConnectionRequest.findOne({
      $or: [
        { from: req.user._id, to },
        { from: to, to: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Connection request already pending" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "Already connected" });
      }
      // If rejected, allow re-sending by updating the existing request
      if (existing.status === "rejected") {
        existing.from = req.user._id;
        existing.to = to;
        existing.status = "pending";
        existing.level = level || 0;
        await existing.save();

        // Create notification for re-sent request
        const { io } = require("../server");
        await createAndEmitNotification({
          recipientId: to,
          senderId: req.user._id,
          type: "connection_request",
          message: `${req.user.name || req.user.username} sent you a connection request`,
          relatedId: existing._id,
          io,
        });

        return res.status(201).json(existing);
      }
    }

    // Create new request
    const request = await ConnectionRequest.create({
      from: req.user._id,
      to,
      level: level || 0,
    });

    // Create & emit notification to recipient
    const { io } = require("../server");
    await createAndEmitNotification({
      recipientId: to,
      senderId: req.user._id,
      type: "connection_request",
      message: `${req.user.name || req.user.username} sent you a connection request`,
      relatedId: request._id,
      io,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("Error sending request:", err);

    // Handle duplicate key error (race condition safety)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Connection request already exists" });
    }

    res.status(500).json({ message: "Error sending connection request" });
  }
};

/**
 * PUT /api/connections/:id/accept
 * Accept a pending connection request
 */
const acceptRequest = async (req, res) => {
  try {
    const request = await ConnectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only the recipient can accept
    if (String(request.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    request.status = "accepted";
    await request.save();

    // Notify the original sender that their request was accepted
    const { io } = require("../server");
    await createAndEmitNotification({
      recipientId: request.from,
      senderId: req.user._id,
      type: "connection_accepted",
      message: `${req.user.name || req.user.username} accepted your connection request`,
      relatedId: request._id,
      io,
    });

    res.json(request);
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ message: "Error accepting connection request" });
  }
};

/**
 * PUT /api/connections/:id/reject
 * Reject a pending connection request
 */
const rejectRequest = async (req, res) => {
  try {
    const request = await ConnectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only the recipient can reject
    if (String(request.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    // Notify the original sender that their request was rejected
    const { io } = require("../server");
    await createAndEmitNotification({
      recipientId: request.from,
      senderId: req.user._id,
      type: "connection_rejected",
      message: `${req.user.name || req.user.username} declined your connection request`,
      relatedId: request._id,
      io,
    });

    res.json(request);
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ message: "Error rejecting connection request" });
  }
};

/**
 * GET /api/connections
 * Get all connection requests for the logged-in user
 * Supports filtering by status: ?status=pending|accepted|rejected
 */
const getRequests = async (req, res) => {
  try {
    const filter = {
      $or: [{ from: req.user._id }, { to: req.user._id }],
    };

    // Optional status filter
    if (req.query.status && ["pending", "accepted", "rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const requests = await ConnectionRequest.find(filter)
      .populate("from", "name username email profilePic")
      .populate("to", "name username email profilePic")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Error fetching requests" });
  }
};

module.exports = { sendRequest, acceptRequest, rejectRequest, getRequests };