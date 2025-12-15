const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Production-ready connection options for Mongoose 8.x
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 8+
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool settings
      maxPoolSize: 10,              // Maximum number of connections in the pool
      minPoolSize: 2,               // Minimum number of connections in the pool

      // Timeout settings
      serverSelectionTimeoutMS: 5000, // Timeout for server selection (5 seconds)
      socketTimeoutMS: 45000,         // Timeout for socket operations (45 seconds)

      // Write concern for data safety
      w: "majority",                  // Wait for write acknowledgment from majority of replicas
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);

    // Log connection pool info in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔗 Connection Pool: min=${2}, max=${10}`);
    }
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;