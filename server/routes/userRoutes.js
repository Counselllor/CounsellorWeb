const express = require("express");
const { updateUserProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware"); // To get req.user from token

const router = express.Router();

// PUT /api/users/update
router.put("/update", protect, updateUserProfile);

module.exports = router;