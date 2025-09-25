const express = require("express");
const router = express.Router();
const {
  addCollege,
  getColleges,
  updateCollege,
  deleteCollege,
  getCollegeBySlug,
} = require("../controllers/collegeController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// GET → anyone can view
router.get("/", getColleges);

// GET -> colleges details by id 
router.get("/:slug", getCollegeBySlug);

// POST → only admin
router.post("/", protect, adminOnly, addCollege);

// PUT → only admin
router.put("/:id", protect, adminOnly, updateCollege);

// DELETE → only admin
router.delete("/:id", protect, adminOnly, deleteCollege);

module.exports = router;