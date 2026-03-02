/**
 * College Routes
 * CRUD operations for college management
 */

const express = require("express");
const router = express.Router();

// Controllers
const {
  addCollege,
  getColleges,
  updateCollege,
  deleteCollege,
  getCollegeBySlug,
} = require("../controllers/collegeController");

// Middleware
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { uploadCollegeImage } = require("../config/cloudinary");
const { validateCollege, validateObjectId } = require("../middleware/validators");

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * @route   GET /api/colleges
 * @desc    Get all colleges
 * @access  Public
 */
router.get("/", getColleges);

/**
 * @route   GET /api/colleges/:slug
 * @desc    Get college by slug
 * @access  Public
 */
router.get("/:slug", getCollegeBySlug);

// ===========================================
// ADMIN ROUTES
// ===========================================

/**
 * @route   POST /api/colleges
 * @desc    Create a new college
 * @access  Admin only
 */
router.post(
  "/",
  protect,
  adminOnly,
  uploadCollegeImage.single("image"),
  validateCollege,
  addCollege
);

/**
 * @route   PUT /api/colleges/:id
 * @desc    Update college by ID
 * @access  Admin only
 */
router.put(
  "/:id",
  protect,
  adminOnly,
  validateObjectId,
  uploadCollegeImage.single("image"),
  updateCollege
);

/**
 * @route   DELETE /api/colleges/:id
 * @desc    Delete college by ID
 * @access  Admin only
 */
router.delete("/:id", protect, adminOnly, validateObjectId, deleteCollege);

module.exports = router;