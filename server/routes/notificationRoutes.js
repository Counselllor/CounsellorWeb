/**
 * Notification Routes
 * All routes are protected — users can only access their own notifications.
 */

const express = require("express");
const router = express.Router();

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validators");

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications
 * @access  Private
 */
router.get("/", getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count (for badge)
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 * NOTE: This route MUST be before /:id/read to avoid "read-all" matching as :id
 */
router.put("/read-all", markAllAsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.put("/:id/read", validateObjectId, markAsRead);

module.exports = router;
