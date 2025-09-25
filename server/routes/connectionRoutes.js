const express = require("express");
const protect = require("../middleware/authMiddleware");
const { sendRequest, acceptRequest, getRequests } = require("../controllers/connectionController");

const router = express.Router();

// Send request
router.post("/", protect, sendRequest);

// Accept request
router.put("/:id/accept", protect, acceptRequest);

// Get requests for logged-in user
router.get("/", protect, getRequests);

module.exports = router;