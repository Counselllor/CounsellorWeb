const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { getMe } = require("../controllers/authController");
const { logoutUser } = require("../controllers/authController");


// @route POST /api/auth/register
router.post("/register", registerUser);

// @route POST /api/auth/login
router.post("/login", loginUser);
// ...
router.get("/me", protect, getMe);

// logout 
router.post("/logout", protect, logoutUser);

module.exports = router;