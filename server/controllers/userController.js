// controllers/userController.js
const User = require("../models/User"); // Import your User model

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body; // Data from client
    const userId = req.user._id; // Authenticated user id from middleware

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates }, // Only update the submitted fields
      { new: true, runValidators: true } // Return new user, validate against schema
    )
      .select("-password") // Don’t leak passwords
      .populate("college", "name location"); // Populate related fields

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = { updateUserProfile };