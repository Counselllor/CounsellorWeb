const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");

// GET current logged-in user  
const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not logged in" });

    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("college", "name location slug");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "An error occurred while fetching the user's profile.", error: err.message });
  }
};


// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, college } = req.body;

    // Check if user exists
    if (!name || !email || !password || !college) {
      return res.status(400).json({ message: "Please provide all required fields, including college." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userByUsername = await User.findOne({ username: req.body.username });
    if (userByUsername) return res.status(400).json({ message: "Username already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      college,
    });

    // Utility function for generating JWT  
    const generateToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    };

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error("❌ Register Error Details:", error); //<-- FULL backend log
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    // Find user by either email or username
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    const user = await User.findOne(email ? { email } : { username });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Mark user as online and save
    user.isOnline = true;
    await user.save();

    // Return user data + token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isOnline: true,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// LOGOUT 
const logoutUser = async (req, res) => {
  try {
    // Make sure user is available from middleware (auth token)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status
    user.isOnline = false;
    user.lastSeen = Date.now();
    await user.save();

    // If you're using JWT, you might also want to clear the token cookie
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Error while logging out" });
  }
};

module.exports = { registerUser, loginUser, getMe, logoutUser };