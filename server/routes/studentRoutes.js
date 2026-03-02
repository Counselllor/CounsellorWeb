/**
 * Student Routes
 * Handles fetching students by college and course filters
 */

const express = require("express");
const router = express.Router();
const { param } = require("express-validator");

// Controllers
const {
    getStudentsByCollege,
    getCoursesByCollege,
} = require("../controllers/studentController");

// Middleware
const { handleValidationErrors } = require("../middleware/validators");

// Validation
const validateCollegeId = [
    param("collegeId").isMongoId().withMessage("Invalid college ID"),
    handleValidationErrors,
];

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * @route   GET /api/students/college/:collegeId
 * @desc    Get all students from a college (with optional course filter)
 * @access  Public
 * @query   course - Filter by course name (optional)
 */
router.get("/college/:collegeId", validateCollegeId, getStudentsByCollege);

/**
 * @route   GET /api/students/college/:collegeId/courses
 * @desc    Get all unique courses from a college
 * @access  Public
 */
router.get("/college/:collegeId/courses", validateCollegeId, getCoursesByCollege);

module.exports = router;