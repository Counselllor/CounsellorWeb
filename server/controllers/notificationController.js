/**
 * Notification Controller
 * CRUD operations for user notifications
 *
 * All endpoints require authentication (protect middleware).
 * Users can only access their own notifications — enforced by
 * filtering on req.user._id in every query.
 */

const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Paginated list of notifications for the logged-in user.
 *
 * Query params:
 *   - page (default: 1)
 *   - limit (default: 20, max: 50)
 *   - unread (optional: "true" to filter unread only)
 */
const getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { recipient: req.user._id };
        if (req.query.unread === "true") {
            filter.isRead = false;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate("sender", "name username profilePic")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // .lean() returns plain objects — faster when we don't need Mongoose methods
            Notification.countDocuments(filter),
        ]);

        res.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

/**
 * GET /api/notifications/unread-count
 * Returns just the count — used for the navbar badge.
 * Lightweight query, no populate needed.
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false,
        });
        res.json({ count });
    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ message: "Error fetching unread count" });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 * Verifies ownership before updating.
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ message: "Error updating notification" });
    }
};

/**
 * PUT /api/notifications/read-all
 * Mark ALL of the user's notifications as read.
 * Uses updateMany for efficiency — single DB round-trip.
 */
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount,
        });
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        res.status(500).json({ message: "Error updating notifications" });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
