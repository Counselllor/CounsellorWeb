/**
 * Admin Middleware
 * Restricts route access to admin users only
 */

/**
 * Admin Only Middleware
 * Must be used AFTER the protect middleware
 */
const adminOnly = async (req, res, next) => {
  try {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    console.error("Admin middleware error:", err.message);
    res.status(500).json({ message: "Server error in admin check" });
  }
};

module.exports = adminOnly;