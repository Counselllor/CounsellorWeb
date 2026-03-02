/**
 * Notification Model
 * Stores persistent notifications for connection requests, acceptances, etc.
 *
 * WHY persist notifications?
 * - Survives page refresh (unlike Socket.IO-only approach)
 * - Enables badge count on initial page load
 * - Allows "notification history" UI
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // Who receives this notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Who triggered it
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Notification category — enables filtering in UI
        type: {
            type: String,
            enum: ["connection_request", "connection_accepted", "connection_rejected"],
            required: true,
        },

        // Human-readable message (pre-computed at creation time)
        // WHY pre-compute? Avoids JOIN/populate on every notification list render
        message: {
            type: String,
            required: true,
            trim: true,
        },

        // Reference to the related document (e.g., ConnectionRequest._id)
        // Enables "click notification → navigate to relevant item"
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Compound index for the most common query:
// "Get this user's unread notifications, newest first"
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
