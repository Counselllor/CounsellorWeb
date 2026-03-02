/**
 * User Routes
 * CRUD operations for user management
 */

const express = require("express");
const router = express.Router();

// Controllers
const {
    getAllUsers,
    getUserById,
    updateUserProfile,
    updateUserById,
    deleteUser,
} = require("../controllers/userController");

// Middleware
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const {
    validateProfileUpdate,
    validateObjectId,
    validateUserQuery,
} = require("../middleware/validators");

// ===========================================
// ADMIN ROUTES (must come before :id routes)
// ===========================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Admin only
 */
router.get("/", protect, adminOnly, validateUserQuery, getAllUsers);

// ===========================================
// AUTHENTICATED USER ROUTES
// ===========================================

/**
 * @route   PUT /api/users/update
 * @desc    Update current user's profile
 * @access  Private
 */
router.put("/update", protect, validateProfileUpdate, updateUserProfile);

// ===========================================
// PARAMETERIZED ROUTES (must come last)
// ===========================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", protect, validateObjectId, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Admin only
 */
router.put(
    "/:id",
    protect,
    adminOnly,
    validateObjectId,
    validateProfileUpdate,
    updateUserById
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Admin only
 */
router.delete("/:id", protect, adminOnly, validateObjectId, deleteUser);

module.exports = router;