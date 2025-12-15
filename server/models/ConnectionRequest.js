const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    level: { type: Number, default: 0 }, // based on rating/ trust level
  },
  { timestamps: true }
);

// Indexes for efficient connection request queries
connectionRequestSchema.index({ from: 1 }); // Find requests sent by a user
connectionRequestSchema.index({ to: 1 });   // Find requests received by a user
connectionRequestSchema.index({ status: 1 }); // Filter by status (pending, accepted, rejected)

// Compound indexes for common query patterns
connectionRequestSchema.index({ from: 1, status: 1 }); // Sent requests filtered by status
connectionRequestSchema.index({ to: 1, status: 1 });   // Received requests filtered by status

// Unique compound index to prevent duplicate connection requests
connectionRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);