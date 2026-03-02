/**
 * Message Model
 * Individual chat messages within a conversation.
 *
 * Messages are always linked to a Conversation document.
 * The conversation's lastMessage field is updated on every new message.
 */

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        // Which conversation this message belongs to
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },

        // Who sent this message
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Message content
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        // Read status — used for read receipts
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Primary query: get messages for a conversation, ordered by time
messageSchema.index({ conversation: 1, createdAt: 1 });

// Secondary: find unread messages in a conversation from a specific sender
messageSchema.index({ conversation: 1, sender: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);
