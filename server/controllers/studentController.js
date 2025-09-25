const User = require("../models/User");

const getStudentsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const students = await User.find({ college: collegeId, role: "counsellor" }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students for this college" });
  }
};

module.exports = { getStudentsByCollege };