/**
 * Authentication Routes
 * Handles user registration, login, logout, profile retrieval, and password reset
 */

const express = require("express");
const router = express.Router();

// Controllers
const {
    registerUser,
    loginUser,
    getMe,
    logoutUser,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

// Middleware
const protect = require("../middleware/authMiddleware");
const { authLimiter, passwordResetLimiter } = require("../middleware/securityMiddleware");
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require("../middleware/validators");

// ===========================================
// PUBLIC ROUTES (with rate limiting)
// ===========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authLimiter, validateRegister, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post("/login", authLimiter, validateLogin, loginUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public (stricter rate limit: 3 req/15min)
 */
router.post("/forgot-password", passwordResetLimiter, validateForgotPassword, forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// ===========================================
// PROTECTED ROUTES
// ===========================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user's profile
 * @access  Private
 */
router.get("/me", protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and update online status
 * @access  Private
 */
router.post("/logout", protect, logoutUser);

module.exports = router;