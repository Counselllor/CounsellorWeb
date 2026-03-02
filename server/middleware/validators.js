/**
 * Input Validation Middleware
 * Validates and sanitizes request data using express-validator
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Handle Validation Errors
 * Returns 400 with error details if validation fails
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

/**
 * User Registration Validation
 */
const validateRegister = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be 2-100 characters")
        .escape(),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase, and number"),

    body("college")
        .notEmpty()
        .withMessage("College is required")
        .isMongoId()
        .withMessage("Invalid college ID"),

    handleValidationErrors,
];

/**
 * User Login Validation
 */
const validateLogin = [
    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("username")
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters"),

    body("password").notEmpty().withMessage("Password is required"),

    // Custom validation: require either email or username
    body().custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
            throw new Error("Email or username is required");
        }
        return true;
    }),

    handleValidationErrors,
];

/**
 * User Profile Update Validation
 */
const validateProfileUpdate = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be 2-100 characters")
        .escape(),

    body("bio")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Bio must be less than 500 characters"),

    body("course")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Course must be less than 100 characters"),

    body("year")
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage("Year must be less than 20 characters"),

    body("skills")
        .optional()
        .isArray()
        .withMessage("Skills must be an array"),

    body("skills.*")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Each skill must be less than 50 characters"),

    handleValidationErrors,
];

/**
 * College Creation/Update Validation
 */
const validateCollege = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("College name is required")
        .isLength({ min: 2, max: 200 })
        .withMessage("Name must be 2-200 characters"),

    body("location")
        .trim()
        .notEmpty()
        .withMessage("Location is required")
        .isLength({ max: 200 })
        .withMessage("Location must be less than 200 characters"),

    body("email")
        .optional({ values: "falsy" })
        .trim()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("phone")
        .optional({ values: "falsy" })
        .trim()
        .matches(/^[+]?[\d\s()-]{10,20}$/)
        .withMessage("Invalid phone number format"),

    body("websiteUrl")
        .optional({ values: "falsy" })
        .trim()
        .isURL()
        .withMessage("Invalid website URL"),

    body("description")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Description must be less than 2000 characters"),

    handleValidationErrors,
];

/**
 * MongoDB ObjectId Validation
 */
const validateObjectId = [
    param("id").isMongoId().withMessage("Invalid ID format"),
    handleValidationErrors,
];

/**
 * Connection Request Validation
 */
const validateConnectionRequest = [
    body("to")
        .notEmpty()
        .withMessage("Recipient user ID is required")
        .isMongoId()
        .withMessage("Invalid recipient ID"),

    body("level")
        .optional()
        .isInt({ min: 0, max: 5 })
        .withMessage("Level must be a number between 0 and 5"),

    handleValidationErrors,
];

/**
 * Query Parameter Validation for User List
 */
const validateUserQuery = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be 1-100"),

    query("role")
        .optional()
        .isIn(["user", "counsellor", "admin"])
        .withMessage("Invalid role"),

    query("college")
        .optional()
        .isMongoId()
        .withMessage("Invalid college ID"),

    query("search")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search query too long"),

    handleValidationErrors,
];

/**
 * Forgot Password Validation
 */
const validateForgotPassword = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    handleValidationErrors,
];

/**
 * Reset Password Validation
 */
const validateResetPassword = [
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase, and number"),

    handleValidationErrors,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateProfileUpdate,
    validateCollege,
    validateObjectId,
    validateConnectionRequest,
    validateUserQuery,
    validateForgotPassword,
    validateResetPassword,
    handleValidationErrors,
};
