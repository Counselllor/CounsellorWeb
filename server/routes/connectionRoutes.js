/**
 * Connection Routes
 * Handles connection requests between users
 */

const express = require("express");
const router = express.Router();

// Controllers
const {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getRequests,
} = require("../controllers/connectionController");

// Middleware
const protect = require("../middleware/authMiddleware");
const {
    validateConnectionRequest,
    validateObjectId,
} = require("../middleware/validators");

// ===========================================
// PROTECTED ROUTES
// ===========================================

/**
 * @route   POST /api/connections
 * @desc    Send a connection request
 * @access  Private
 */
router.post("/", protect, validateConnectionRequest, sendRequest);

/**
 * @route   PUT /api/connections/:id/accept
 * @desc    Accept a connection request
 * @access  Private
 */
router.put("/:id/accept", protect, validateObjectId, acceptRequest);

/**
 * @route   PUT /api/connections/:id/reject
 * @desc    Reject a connection request
 * @access  Private
 */
router.put("/:id/reject", protect, validateObjectId, rejectRequest);

/**
 * @route   GET /api/connections
 * @desc    Get all connection requests for logged-in user
 * @access  Private
 */
router.get("/", protect, getRequests);

module.exports = router;