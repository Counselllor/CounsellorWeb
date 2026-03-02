/**
 * Message Controller
 * Handles DM conversations and messages between connected users.
 *
 * SECURITY: Every endpoint verifies that the requesting user is a participant
 * in the conversation. Users can only access their own conversations.
 *
 * CONNECTION CHECK: Before creating a conversation, we verify that the two users
 * have an accepted connection request. This prevents random users from DMing each other.
 */

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/User");

/**
 * GET /api/messages/conversations
 * Get all conversations for the logged-in user (sidebar data).
 * Returns conversations sorted by most recent activity, with participant info.
 */
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate("participants", "name username profilePic isOnline lastSeen")
            .populate("lastMessage.sender", "name username")
            .sort({ updatedAt: -1 })
            .lean();

        // Transform: add the "other user" and their unread count for convenience
        const transformed = conversations.map((conv) => {
            const otherUser = conv.participants.find(
                (p) => String(p._id) !== String(req.user._id)
            );
            const myUnread = conv.unreadCounts?.get
                ? conv.unreadCounts.get(String(req.user._id)) || 0
                : conv.unreadCounts?.[String(req.user._id)] || 0;

            return {
                ...conv,
                otherUser,
                myUnread,
            };
        });

        res.json(transformed);
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ message: "Error fetching conversations" });
    }
};

/**
 * POST /api/messages/conversations
 * Get or create a conversation with a connected user.
 * Body: { userId: "<target user id>" }
 *
 * FLOW:
 * 1. Verify connection exists and is accepted
 * 2. Check if conversation already exists (sorted participant lookup)
 * 3. If not, create new conversation
 */
const getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        if (String(userId) === String(req.user._id)) {
            return res.status(400).json({ message: "Cannot start conversation with yourself" });
        }

        // Verify the target user exists
        const targetUser = await User.findById(userId).select("name username profilePic isOnline");
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify connection exists and is accepted
        const connection = await ConnectionRequest.findOne({
            $or: [
                { from: req.user._id, to: userId, status: "accepted" },
                { from: userId, to: req.user._id, status: "accepted" },
            ],
        });

        if (!connection) {
            return res.status(403).json({
                message: "You must be connected with this user to send messages",
            });
        }

        // Sort participant IDs for consistent lookup
        const participants = [req.user._id, userId].sort((a, b) =>
            String(a).localeCompare(String(b))
        );

        // Find existing or create new
        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants,
                unreadCounts: new Map([
                    [String(req.user._id), 0],
                    [String(userId), 0],
                ]),
            });
        }

        // Populate and return
        const populated = await Conversation.findById(conversation._id)
            .populate("participants", "name username profilePic isOnline lastSeen")
            .populate("lastMessage.sender", "name username")
            .lean();

        // Add convenience fields
        const otherUser = populated.participants.find(
            (p) => String(p._id) !== String(req.user._id)
        );

        res.json({ ...populated, otherUser });
    } catch (err) {
        console.error("Error creating conversation:", err);
        res.status(500).json({ message: "Error creating conversation" });
    }
};

/**
 * GET /api/messages/:conversationId
 * Get paginated message history for a conversation.
 * Query params: page (default 1), limit (default 50)
 */
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const [messages, total] = await Promise.all([
            Message.find({ conversation: conversationId })
                .populate("sender", "name username profilePic")
                .sort({ createdAt: -1 }) // newest first — client reverses for display
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments({ conversation: conversationId }),
        ]);

        res.json({
            messages: messages.reverse(), // return in chronological order
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ message: "Error fetching messages" });
    }
};

/**
 * POST /api/messages/:conversationId
 * Send a message via REST (fallback if Socket.IO is unavailable).
 * The primary send path is via Socket.IO (dm:send event) in server.js.
 */
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text is required" });
        }

        if (text.trim().length > 5000) {
            return res.status(400).json({ message: "Message too long (max 5000 characters)" });
        }

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Create message
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: text.trim(),
        });

        // Update conversation's lastMessage and increment recipient's unread count
        const recipientId = conversation.participants.find(
            (p) => String(p) !== String(req.user._id)
        );

        conversation.lastMessage = {
            text: text.trim().substring(0, 100), // truncate for preview
            sender: req.user._id,
            createdAt: message.createdAt,
        };

        // Increment unread for the other user
        const currentUnread = conversation.unreadCounts?.get(String(recipientId)) || 0;
        conversation.unreadCounts.set(String(recipientId), currentUnread + 1);
        await conversation.save();

        // Populate for response
        const populated = await Message.findById(message._id)
            .populate("sender", "name username profilePic")
            .lean();

        // Emit via Socket.IO if available
        try {
            const { io } = require("../server");
            if (io) {
                io.to(`user:${recipientId}`).emit("dm:receive", {
                    message: populated,
                    conversationId,
                });
            }
        } catch (e) {
            // Socket.IO not available — message is still persisted
        }

        res.status(201).json(populated);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ message: "Error sending message" });
    }
};

/**
 * PUT /api/messages/:conversationId/read
 * Mark all messages in a conversation as read for the current user.
 * Also resets the unread count in the Conversation document.
 */
const markConversationRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Mark all messages from the OTHER user as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                isRead: false,
            },
            { isRead: true }
        );

        // Reset unread count for this user
        conversation.unreadCounts.set(String(req.user._id), 0);
        await conversation.save();

        // Notify the other user that their messages were read (read receipts)
        const otherUserId = conversation.participants.find(
            (p) => String(p) !== String(req.user._id)
        );

        try {
            const { io } = require("../server");
            if (io) {
                io.to(`user:${otherUserId}`).emit("dm:read", {
                    conversationId,
                    readBy: req.user._id,
                });
            }
        } catch (e) {
            // Socket.IO not available
        }

        res.json({ message: "Messages marked as read" });
    } catch (err) {
        console.error("Error marking conversation read:", err);
        res.status(500).json({ message: "Error marking messages as read" });
    }
};

module.exports = {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    markConversationRead,
};
