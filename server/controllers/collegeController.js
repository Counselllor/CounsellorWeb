/**
 * College Controller
 * Handles CRUD operations for colleges
 */

const College = require("../models/College");
const slugify = require("slugify");

// ===========================================
// GET ALL COLLEGES
// ===========================================

/**
 * Get all colleges
 * @route   GET /api/colleges
 * @access  Public
 */
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json(colleges);
  } catch (err) {
    console.error("Error fetching colleges:", err.message);
    res.status(500).json({ message: "Error fetching colleges" });
  }
};

// ===========================================
// GET COLLEGE BY SLUG
// ===========================================

/**
 * Get a single college by slug
 * @route   GET /api/colleges/:slug
 * @access  Public
 */
const getCollegeBySlug = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug });

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json(college);
  } catch (err) {
    console.error("Error fetching college:", err.message);
    res.status(500).json({ message: "Error fetching college" });
  }
};

// ===========================================
// ADD COLLEGE
// ===========================================

/**
 * Create a new college
 * @route   POST /api/colleges
 * @access  Admin only
 */
const addCollege = async (req, res) => {
  try {
    const { name, location, address, description, email, phone, websiteUrl } =
      req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({
        message: "Name and location are required",
      });
    }

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check for duplicate
    const existingCollege = await College.findOne({ slug });
    if (existingCollege) {
      return res.status(400).json({
        message: "A college with this name already exists",
      });
    }

    // Get image URL from Cloudinary upload or request body
    const imageUrl = req.file ? req.file.path : req.body.imageUrl || null;

    // Create college
    const college = await College.create({
      name: name.trim(),
      slug,
      location: location.trim(),
      address: address?.trim(),
      description: description?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      websiteUrl: websiteUrl?.trim(),
      imageUrl,
    });

    res.status(201).json(college);
  } catch (err) {
    console.error("Error creating college:", err.message);
    res.status(500).json({ message: "Error creating college" });
  }
};

// ===========================================
// UPDATE COLLEGE
// ===========================================

/**
 * Update a college by ID
 * @route   PUT /api/colleges/:id
 * @access  Admin only
 */
const updateCollege = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If new image was uploaded, use Cloudinary URL
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    // Update slug if name changed
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }

    const college = await College.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json(college);
  } catch (err) {
    console.error("Error updating college:", err.message);
    res.status(500).json({ message: "Error updating college" });
  }
};

// ===========================================
// DELETE COLLEGE
// ===========================================

/**
 * Delete a college by ID
 * @route   DELETE /api/colleges/:id
 * @access  Admin only
 */
const deleteCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json({
      message: "College deleted successfully",
      college: { _id: college._id, name: college.name },
    });
  } catch (err) {
    console.error("Error deleting college:", err.message);
    res.status(500).json({ message: "Error deleting college" });
  }
};

module.exports = {
  addCollege,
  getColleges,
  updateCollege,
  deleteCollege,
  getCollegeBySlug,
};
