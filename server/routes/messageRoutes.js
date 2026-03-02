/**
 * Message Routes
 * DM conversation and message endpoints.
 * All routes require authentication.
 */

const express = require("express");
const router = express.Router();

const {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    markConversationRead,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for logged-in user (sidebar)
 * @access  Private
 */
router.get("/conversations", getConversations);

/**
 * @route   POST /api/messages/conversations
 * @desc    Get or create conversation with a connected user
 * @access  Private
 */
router.post("/conversations", getOrCreateConversation);

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get paginated message history
 * @access  Private
 */
router.get("/:conversationId", getMessages);

/**
 * @route   POST /api/messages/:conversationId
 * @desc    Send a message (REST fallback)
 * @access  Private
 */
router.post("/:conversationId", sendMessage);

/**
 * @route   PUT /api/messages/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put("/:conversationId/read", markConversationRead);

module.exports = router;
