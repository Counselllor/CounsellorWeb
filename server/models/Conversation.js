/**
 * Conversation Model
 * Links exactly two users in a DM conversation.
 *
 * WHY this model exists (vs. just querying Messages):
 * Without it, rendering "recent conversations" requires an expensive aggregation
 * across ALL messages every time. This model acts as a read-optimized index:
 * - One query gets all conversations with last message preview
 * - Unread counts are pre-computed per user (no COUNT(*) needed)
 */

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        // Exactly two participants — sorted on creation for consistent lookups
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        // Denormalized last message for sidebar preview
        // WHY denormalize? Avoids a JOIN/populate for every conversation in the list.
        // Trade-off: updated on every message send (write amplification — acceptable at this scale)
        lastMessage: {
            text: { type: String, default: "" },
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
        },

        // Per-user unread count stored as a Map
        // Key: userId (string), Value: unread message count
        // WHY Map? Avoids needing separate documents or complex queries per user
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

// Find all conversations for a user (sidebar query)
conversationSchema.index({ participants: 1 });

// Unique pair — prevent duplicate conversations between same two users
// NOTE: participants must be sorted before insertion to make this work
conversationSchema.index(
    { participants: 1 },
    {
        unique: true,
        partialFilterExpression: { "participants.1": { $exists: true } },
    }
);

// Sort conversations by most recent activity
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
