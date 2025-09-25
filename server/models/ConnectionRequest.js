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

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);