const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Core account fields 
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },

    // Role and authentication  
    role: { type: String, enum: ["user", "counsellor"], default: "user" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },

    // Profile fields  
    bio: { type: String, trim: true },
    profilePic: { type: String, trim: true }, // URL or file path for the profile picture  

    // Academic details  
    // college: { type: String, trim: true },
    // college: { type: mongoose.Schema.Types.ObjectId, ref: "College" }, // Reference to College model  
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },

    course: { type: String, trim: true },
    year: { type: String, trim: true },

    // Skills and rating
    skills: [{ type: String, trim: true }], // You can use an array if skills are multiple
    rating: { type: Number, default: 0, min: 0, max: 5 }, // Rating between 0 and 5

  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Index for querying users by college (improves performance for college-based lookups)
userSchema.index({ college: 1 });

// Compound index for role-based queries within a college
userSchema.index({ college: 1, role: 1 });

module.exports = mongoose.model("User", userSchema);