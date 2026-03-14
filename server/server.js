/**
 * Main Server Configuration
 * Express server with MongoDB, Socket.IO (authenticated rooms + DM), and security middleware
 */

require("dotenv").config({ override: true });

const express = require("express");
const http = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// Route imports
const collegeRoutes = require("./routes/collegeRoutes");
const studentRoutes = require("./routes/studentRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Security middleware
const {
	generalLimiter,
	helmetConfig,
	sanitizeInput,
} = require("./middleware/securityMiddleware");

// Database connection
const connectDB = require("./config/db");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

// Initialize Express app
const app = express();

// ===========================================
// CORS CONFIGURATION
// ===========================================
// Must be defined before use in both Express and Socket.IO

const allowedOrigins = process.env.CLIENT_ORIGIN
	? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
	: ["http://localhost:3000"];

// Scoped only to this project's Vercel preview URLs — not all of vercel.app
const allowedPatterns = [
	/^https:\/\/counsellor-[a-z0-9-]+\.vercel\.app$/,
];

/**
 * Shared origin validator used by both Express CORS and Socket.IO CORS.
 * Returns true if the origin is allowed, false otherwise.
 */
const isOriginAllowed = (origin) => {
	if (!origin) return true; // Allow Postman, curl, mobile apps
	if (allowedOrigins.includes("*")) return true;
	if (allowedOrigins.includes(origin)) return true;
	if (allowedPatterns.some((pattern) => pattern.test(origin))) return true;
	// Allow localhost variants for local development
	if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
	return false;
};

const corsOriginHandler = (origin, callback) => {
	if (isOriginAllowed(origin)) {
		callback(null, true);
	} else {
		console.warn(`⚠️  CORS blocked origin: ${origin}`);
		callback(new Error("Not allowed by CORS"));
	}
};

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Security headers
app.use(helmetConfig);

// FIX #3: CORS must come before rate limiter so that rate-limited responses
// (429) still carry the correct Access-Control-Allow-Origin header.
// Previously the limiter ran first, causing browsers to surface a false
// CORS error instead of the real 429.
app.use(
	cors({
		origin: corsOriginHandler,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		maxAge: 86400, // Cache preflight for 24 hours
	})
);

// Rate limiting — applied after CORS so error responses include CORS headers
app.use(generalLimiter);

// ===========================================
// BODY PARSING MIDDLEWARE
// ===========================================

// Limit request body size to prevent DoS
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sanitize input to prevent NoSQL injection
app.use(sanitizeInput);

// ===========================================
// DATABASE CONNECTION
// ===========================================

if (process.env.MONGO_URI) {
	connectDB();
} else {
	console.warn("⚠️  MONGO_URI not set — skipping database connection");
}

// ===========================================
// HEALTH CHECK ROUTE
// ===========================================

app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// ===========================================
// API ROUTES
// ===========================================

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
	res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
	console.error("Server Error:", err.message);

	if (err.message === "Not allowed by CORS") {
		return res.status(403).json({ message: "CORS policy violation" });
	}

	res.status(err.status || 500).json({
		message:
			process.env.NODE_ENV === "production"
				? "Internal server error"
				: err.message,
	});
});

// ===========================================
// HTTP SERVER & SOCKET.IO
// ===========================================

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		// FIX: Socket.IO now uses the same shared origin validator as Express
		origin: corsOriginHandler,
		methods: ["GET", "POST"],
		credentials: true,
	},
	pingTimeout: 60000,
	pingInterval: 25000,
});

// ===========================================
// SOCKET.IO AUTHENTICATION MIDDLEWARE
// ===========================================
// Runs once per connection attempt. Verifies the JWT token
// sent from the client via socket.handshake.auth.token.
// If invalid → connection is rejected before any events can be exchanged.

io.use(async (socket, next) => {
	try {
		const token = socket.handshake.auth?.token;

		if (!token) {
			return next(new Error("Authentication required"));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.id).select("name username role");
		if (!user) {
			return next(new Error("User not found"));
		}

		socket.user = {
			_id: user._id.toString(),
			name: user.name,
			username: user.username,
			role: user.role,
		};

		next();
	} catch (err) {
		console.error("Socket auth error:", err.message);
		next(new Error("Invalid or expired token"));
	}
});

// ===========================================
// SOCKET.IO CONNECTION HANDLING
// ===========================================

io.on("connection", async (socket) => {
	const userId = socket.user._id;
	console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

	// ── JOIN PERSONAL ROOM ──────────────────────────────────
	// Every user joins a room named "user:<userId>"
	// This allows targeted emits from controllers (e.g. notifications, DMs)
	socket.join(`user:${userId}`);

	// ── UPDATE ONLINE STATUS ────────────────────────────────
	try {
		await User.findByIdAndUpdate(userId, {
			isOnline: true,
			lastSeen: new Date(),
		});
	} catch (err) {
		console.error("Error updating online status:", err.message);
	}

	// FIX #5: Cache conversationId → recipientId in memory per socket connection
	// so dm:typing doesn't hit the database on every keystroke.
	const recipientCache = new Map();

	/**
	 * Resolves the recipient ID for a given conversation, using an in-memory
	 * cache to avoid redundant DB lookups during rapid events (e.g. typing).
	 */
	const getRecipientId = async (conversationId) => {
		if (recipientCache.has(conversationId)) {
			return recipientCache.get(conversationId);
		}

		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: userId,
		}).lean();

		if (!conversation) return null;

		const recipientId = conversation.participants.find(
			(p) => String(p) !== userId
		);

		if (!recipientId) return null;

		const rid = String(recipientId);
		recipientCache.set(conversationId, rid);
		return rid;
	};

	// ── GLOBAL CHAT (broadcast to all) ─────────────────────
	socket.on("message", (payload) => {
		io.emit("message", {
			...payload,
			user: socket.user.username,
			timestamp: new Date().toISOString(),
		});
	});

	// ── DM: SEND MESSAGE ────────────────────────────────────
	// Client emits: { conversationId, text }
	// Server: saves to DB → updates conversation atomically → emits to recipient
	socket.on("dm:send", async ({ conversationId, text }, callback) => {
		try {
			// FIX #7: Trim once and reuse throughout
			const trimmedText = text?.trim();

			if (!trimmedText || !conversationId) {
				return callback?.({ error: "Invalid message data" });
			}

			if (trimmedText.length > 5000) {
				return callback?.({ error: "Message too long" });
			}

			// Verify sender is a participant
			const conversation = await Conversation.findOne({
				_id: conversationId,
				participants: userId,
			});

			if (!conversation) {
				return callback?.({ error: "Conversation not found" });
			}

			// FIX #2: Guard against undefined recipientId before using it
			const recipientId = conversation.participants.find(
				(p) => String(p) !== userId
			);

			if (!recipientId) {
				return callback?.({ error: "Could not determine recipient" });
			}

			const recipientIdStr = String(recipientId);

			// Save message to DB
			const message = await Message.create({
				conversation: conversationId,
				sender: userId,
				text: trimmedText,
			});

			// FIX #1: Update conversation atomically using $set + $inc to eliminate
			// the read-modify-write race condition that caused lost unread increments
			// when two messages arrived in quick succession.
			await Conversation.findByIdAndUpdate(conversationId, {
				$set: {
					lastMessage: {
						text: trimmedText.substring(0, 100),
						sender: userId,
						createdAt: message.createdAt,
					},
				},
				$inc: {
					[`unreadCounts.${recipientIdStr}`]: 1,
				},
			});

			// Also warm the recipient cache for this socket
			recipientCache.set(conversationId, recipientIdStr);

			// Populate sender info for the emit payload
			const populated = await Message.findById(message._id)
				.populate("sender", "name username profilePic")
				.lean();

			// Emit to recipient's personal room
			io.to(`user:${recipientIdStr}`).emit("dm:receive", {
				message: populated,
				conversationId,
			});

			// Acknowledge to sender with the saved message
			callback?.({ message: populated });
		} catch (err) {
			console.error("dm:send error:", err);
			callback?.({ error: "Failed to send message" });
		}
	});

	// ── DM: TYPING INDICATOR ────────────────────────────────
	// Not persisted — just relayed in real-time.
	// FIX #5 + #6: Validate payload and use in-memory cache instead of a DB
	// query on every keystroke.
	socket.on("dm:typing", async ({ conversationId, isTyping }) => {
		// FIX #6: Validate payload before doing anything
		if (!conversationId) return;

		try {
			const recipientId = await getRecipientId(conversationId);
			if (!recipientId) return;

			io.to(`user:${recipientId}`).emit("dm:typing", {
				conversationId,
				userId,
				username: socket.user.username,
				isTyping,
			});
		} catch (err) {
			console.error("dm:typing error:", err.message);
		}
	});

	// ── DM: MARK AS READ ────────────────────────────────────
	// Client emits when they open/view a conversation
	socket.on("dm:markRead", async ({ conversationId }) => {
		// FIX #6: Validate payload
		if (!conversationId) return;

		try {
			const conversation = await Conversation.findOne({
				_id: conversationId,
				participants: userId,
			});

			if (!conversation) return;

			// Mark all unread messages from the other user as read
			await Message.updateMany(
				{
					conversation: conversationId,
					sender: { $ne: userId },
					isRead: false,
				},
				{ isRead: true }
			);

			// FIX #2: Guard against undefined otherUserId
			const otherUserId = conversation.participants.find(
				(p) => String(p) !== userId
			);

			if (!otherUserId) return;

			// Reset this user's unread count atomically
			await Conversation.findByIdAndUpdate(conversationId, {
				$set: { [`unreadCounts.${userId}`]: 0 },
			});

			// Notify the other user (read receipt)
			io.to(`user:${String(otherUserId)}`).emit("dm:read", {
				conversationId,
				readBy: userId,
			});
		} catch (err) {
			console.error("dm:markRead error:", err.message);
		}
	});

	// ── DISCONNECT ──────────────────────────────────────────
	socket.on("disconnect", async (reason) => {
		console.log(`🔌 Socket disconnected: ${socket.user.username} (${reason})`);
		try {
			await User.findByIdAndUpdate(userId, {
				isOnline: false,
				lastSeen: new Date(),
			});
		} catch (err) {
			console.error("Error updating offline status:", err.message);
		}
	});

	socket.on("error", (error) => {
		console.error("Socket error:", error);
	});
});

// ===========================================
// SERVER STARTUP
// ===========================================

const PORT = process.env.PORT || 5000;

// FIX #9: Only start listening when this file is run directly (node server.js),
// not when it is require()'d by a test suite. Prevents the server from binding
// a port during imports, which would make unit/integration tests unreliable.
if (require.main === module) {
	server.listen(PORT, () => {
		console.log(`🚀 Server running on port ${PORT}`);
		console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
	});
}

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

const shutdown = async (signal) => {
	console.log(`\nReceived ${signal}. Closing server...`);

	server.close(async () => {
		console.log("✅ HTTP server closed.");

		// FIX #8: Close the MongoDB connection before exiting so in-flight
		// writes are flushed and the process exits cleanly.
		try {
			await mongoose.connection.close();
			console.log("✅ MongoDB connection closed.");
		} catch (err) {
			console.error("Error closing MongoDB connection:", err.message);
		}

		process.exit(0);
	});

	// Force exit after 10 seconds if something hangs
	setTimeout(() => {
		console.error("⚠️  Forcing exit after timeout");
		process.exit(1);
	}, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	shutdown("uncaughtException");
});

module.exports = { app, server, io };
// exported file for testing