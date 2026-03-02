/**
 * Admin Seeder Script
 * 
 * Creates an admin user from environment variables.
 * Run: npm run seed (from server directory)
 * 
 * Required Environment Variables:
 * - MONGO_URI: MongoDB connection string
 * - ADMIN_NAME: Admin's display name
 * - ADMIN_USERNAME: Admin's username (for login)
 * - ADMIN_EMAIL: Admin's email (for login)
 * - ADMIN_PASSWORD: Admin's password (will be hashed)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  // Validate required environment variables
  const requiredEnvVars = ["MONGO_URI", "ADMIN_NAME", "ADMIN_USERNAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error("\n📝 Add these to your .env file:");
    console.error("   ADMIN_NAME=Admin User");
    console.error("   ADMIN_USERNAME=admin");
    console.error("   ADMIN_EMAIL=admin@example.com");
    console.error("   ADMIN_PASSWORD=your_secure_password");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: process.env.ADMIN_EMAIL },
        { username: process.env.ADMIN_USERNAME },
      ],
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);

      // Option to update to admin role if not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Updated existing user to admin role");
      }

      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    // Create admin user
    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      // college is optional for admin
    });

    console.log("\n🎉 Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Role:     ${admin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 You can now login with:");
    console.log(`   Email/Username: ${admin.email} or ${admin.username}`);
    console.log("   Password: (the one you set in .env)");

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeder
seedAdmin();

