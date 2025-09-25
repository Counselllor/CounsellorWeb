const College = require("../models/College");
const slugify = require("slugify");




// GET all colleges
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: "Error fetching colleges" });
  }
};

// GET a college by slug
const getCollegeBySlug = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug });
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: "Error fetching college" });
  }
};


// Add College
const addCollege = async (req, res) => {
  try {
    const { name, location, address, description, email, phone, websiteUrl, imageUrl } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existingCollege = await College.findOne({ slug });
    if (existingCollege) {
      return res.status(400).json({ message: "College with this name already exists!" });
    }

    const college = await College.create({
      name,
      location,
      address,
      description,
      email,
      phone,
      websiteUrl,
      imageUrl,
    });

    res.status(201).json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Colleges
// const getColleges = async (req, res) => {
//   try {
//     const colleges = await College.find();
//     res.json(colleges);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Update College
const updateCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete College
const deleteCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json({ message: "College deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addCollege, getColleges, updateCollege, deleteCollege, getCollegeBySlug };
