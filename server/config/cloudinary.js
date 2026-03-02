const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine for college images
const collegeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "counsellor/colleges", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 600, crop: "limit" }, // Auto-resize large images
      { quality: "auto" }, // Auto-optimize quality
      { fetch_format: "auto" }, // Serve WebP when supported
    ],
  },
});

// Create multer upload middleware
const uploadCollegeImage = multer({ 
  storage: collegeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = { cloudinary, uploadCollegeImage };