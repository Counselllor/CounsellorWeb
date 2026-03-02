const User = require("../models/User");

/**
 * Get all students from a specific college
 * Optionally filter by course (BTech, MBA, etc.)
 *
 * Query params:
 * - course: Filter by course name (optional)
 */
const getStudentsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { course } = req.query;

    // Build query - find all users (not just counsellors) from this college
    // Exclude admin users from student list
    const query = {
      college: collegeId,
      role: { $ne: "admin" } // Exclude admins
    };

    // Add course filter if provided
    if (course && course !== "all") {
      query.course = course;
    }

    const students = await User.find(query)
      .select("-password")
      .populate("college", "name location slug")
      .sort({ createdAt: -1 }); // Newest first

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students for this college" });
  }
};

/**
 * Get all unique courses from a specific college
 * Used for filtering dropdown
 */
const getCoursesByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    const courses = await User.distinct("course", {
      college: collegeId,
      role: { $ne: "admin" },
      course: { $exists: true, $ne: null, $ne: "" }
    });

    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Error fetching courses" });
  }
};

module.exports = { getStudentsByCollege, getCoursesByCollege };