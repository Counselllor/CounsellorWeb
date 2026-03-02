const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // Built-in Node.js module for secure token generation
const generateToken = require("../utils/generateToken");

// ===========================================
// GET CURRENT USER
// ===========================================

/**
 * Get current logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("college", "name location slug");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GetMe error:", err.message);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

// ===========================================
// USER REGISTRATION
// ===========================================

/**
 * Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, college } = req.body;

    // Check required fields
    if (!name || !email || !password || !college) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      college,
    });

    // Return user data with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      college: user.college,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Error during registration" });
  }
};

// ===========================================
// USER LOGIN
// ===========================================

/**
 * Login user and return token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!password || (!email && !username)) {
      return res.status(400).json({
        message: "Email/Username and password are required",
      });
    }

    // Find user by email or username
    const query = email
      ? { email: email.toLowerCase() }
      : { username };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Return user data with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isOnline: true,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Error during login" });
  }
};

// ===========================================
// USER LOGOUT
// ===========================================

/**
 * Logout user and update status
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update online status
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    // Clear cookie if using cookies
    res.clearCookie("token");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Error during logout" });
  }
};

// ===========================================
// FORGOT PASSWORD
// ===========================================

/**
 * Request a password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * SECURITY DECISIONS:
 * 1. Always returns success — prevents user enumeration attacks
 *    (attacker can't determine which emails are registered)
 * 2. Token is stored as SHA-256 hash in DB — if DB is breached,
 *    raw tokens cannot be extracted
 * 3. 1-hour expiry limits the attack window
 * 4. New request overwrites previous token — only latest link works,
 *    preventing token accumulation
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Look up user — but NEVER reveal whether email exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Generate cryptographically secure random token (32 bytes = 64 hex chars)
      // WHY crypto.randomBytes? It uses OS-level entropy (e.g., /dev/urandom),
      // making it unpredictable — unlike Math.random() which is NOT cryptographically secure
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Store HASHED token in DB — even if DB is compromised, attackers
      // can't use the stored hash to reset passwords
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Token expires in 1 hour — balances usability with security
      // (shorter = more secure, but users may not check email immediately)
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

      await user.save();

      // ─── EMAIL INTEGRATION POINT ───────────────────────────────
      // In production, replace this console.log with nodemailer:
      //
      //   const transporter = nodemailer.createTransport({
      //     host: process.env.SMTP_HOST,
      //     port: process.env.SMTP_PORT,
      //     auth: {
      //       user: process.env.SMTP_USER,
      //       pass: process.env.SMTP_PASS,
      //     },
      //   });
      //
      //   await transporter.sendMail({
      //     from: '"Counsellor App" <noreply@counsellor.com>',
      //     to: user.email,
      //     subject: "Password Reset Request",
      //     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      //   });
      // ──────────────────────────────────────────────────────────

      const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:3000"}/reset-password/${resetToken}`;
      console.log(`🔐 Password reset URL for ${user.email}: ${resetUrl}`);
    }

    // ALWAYS return success — prevents user enumeration
    // An attacker cannot tell if an email is registered or not
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Error processing password reset request" });
  }
};

// ===========================================
// RESET PASSWORD
// ===========================================

/**
 * Reset password using token from email link
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 *
 * SECURITY DECISIONS:
 * 1. Token is received as URL param (not query string) — prevents
 *    accidental logging in server access logs / analytics
 * 2. New password is sent in POST body — never in URL
 * 3. Token fields are cleared after successful reset — single-use only
 * 4. Uses bcrypt with salt factor 12 — same strength as registration
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Hash the incoming token to match the stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that hasn't expired
    // We must explicitly select the hidden fields (select: false in schema)
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Token must not be expired
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    // Hash new password with same strength as registration
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset fields — token is single-use
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};