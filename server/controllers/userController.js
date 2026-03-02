/**
 * USER CONTROLLER - FULL CRUD OPERATIONS
 */

const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
  try {
    const { role, college, course, search, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (college) query.college = college;
    if (course) query.course = course;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("college", "name location slug")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-password")
      .populate("college", "name location slug imageUrl");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user._id;

    delete updates.role;
    delete updates.password;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("college", "name location slug");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};

const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("college", "name location slug");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Error updating user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user: { _id: user._id, name: user.name } });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

module.exports = { 
  getAllUsers,
  getUserById,
  updateUserProfile, 
  updateUserById,
  deleteUser
};
