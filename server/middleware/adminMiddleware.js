const User = require("../models/User");

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user && user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error in admin check" });
  }
};

module.exports = adminOnly;