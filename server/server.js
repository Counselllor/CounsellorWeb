/**
 * Main Server Configuration
 * Express server with MongoDB, Socket.IO (authenticated rooms + DM), and security middleware
 */

require("dotenv").config({ override: true });

const express = require("express");
const http = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
// SECURITY MIDDLEWARE
// ===========================================

// Security headers (helmet)
app.use(helmetConfig);

// Rate limiting - apply to all requests
app.use(generalLimiter);

// ===========================================
// CORS CONFIGURATION (FIXED)
// ===========================================

const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:3000"];

// Pattern matching for Vercel preview deployments
const allowedPatterns = [
    /^https:\/\/counsellor-.*\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/  // Allow all Vercel previews
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, curl, etc.)
            if (!origin) return callback(null, true);

            // Check exact match in allowed origins
            if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                return callback(null, true);
            }

            // Check pattern match (Vercel previews)
            if (allowedPatterns.some((pattern) => pattern.test(origin))) {
                return callback(null, true);
            }

            // Allow localhost for development
            if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
                return callback(null, true);
            }

            // Reject all others
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        maxAge: 86400, // Cache preflight for 24 hours
    })
);

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

	// CORS error
	if (err.message === "Not allowed by CORS") {
		return res.status(403).json({ message: "CORS policy violation" });
	}

	// Default error response
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
		origin: (origin, callback) => {
			// Allow requests with no origin
			if (!origin) return callback(null, true);

			// Check exact match
			if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
				return callback(null, true);
			}

			// Check pattern match (Vercel previews)
			if (allowedPatterns.some((pattern) => pattern.test(origin))) {
				return callback(null, true);
			}

			// Allow localhost
			if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
				return callback(null, true);
			}

			// Reject
			console.warn(`⚠️ Socket.IO CORS blocked origin: ${origin}`);
			callback(new Error("Not allowed by CORS"));
		},
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

		// Verify JWT — same secret as the REST API auth middleware
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Attach user info to the socket for use in event handlers
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
	// This allows targeted emits from controllers (e.g., notification, DM)
	socket.join(`user:${userId}`);

	// ── UPDATE ONLINE STATUS ────────────────────────────────
	try {
		await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
	} catch (err) {
		console.error("Error updating online status:", err.message);
	}

	// ── GLOBAL CHAT (existing feature — broadcast to all) ───
	socket.on("message", (payload) => {
		io.emit("message", {
			...payload,
			user: socket.user.username,
			timestamp: new Date().toISOString(),
		});
	});

	// ── DM: SEND MESSAGE ────────────────────────────────────
	// Primary real-time message send path.
	// Client emits: { conversationId, text }
	// Server: saves to DB → updates conversation → emits to recipient
	socket.on("dm:send", async ({ conversationId, text }, callback) => {
		try {
			if (!text?.trim() || !conversationId) {
				return callback?.({ error: "Invalid message data" });
			}

			if (text.trim().length > 5000) {
				return callback?.({ error: "Message too long" });
			}

			// Verify user is a participant
			const conversation = await Conversation.findOne({
				_id: conversationId,
				participants: userId,
			});

			if (!conversation) {
				return callback?.({ error: "Conversation not found" });
			}

			// Save message
			const message = await Message.create({
				conversation: conversationId,
				sender: userId,
				text: text.trim(),
			});

			// Update conversation lastMessage + unread count
			const recipientId = conversation.participants.find(
				(p) => String(p) !== userId
			);

			conversation.lastMessage = {
				text: text.trim().substring(0, 100),
				sender: userId,
				createdAt: message.createdAt,
			};

			const currentUnread = conversation.unreadCounts?.get(String(recipientId)) || 0;
			conversation.unreadCounts.set(String(recipientId), currentUnread + 1);
			await conversation.save();

			// Populate sender info for the emit payload
			const populated = await Message.findById(message._id)
				.populate("sender", "name username profilePic")
				.lean();

			// Emit to recipient's personal room
			io.to(`user:${recipientId}`).emit("dm:receive", {
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
	// Not persisted — just relayed in real-time
	socket.on("dm:typing", ({ conversationId, isTyping }) => {
		// Find the conversation to get the recipient
		Conversation.findOne({
			_id: conversationId,
			participants: userId,
		}).then((conversation) => {
			if (!conversation) return;

			const recipientId = conversation.participants.find(
				(p) => String(p) !== userId
			);

			if (recipientId) {
				io.to(`user:${recipientId}`).emit("dm:typing", {
					conversationId,
					userId,
					username: socket.user.username,
					isTyping,
				});
			}
		}).catch((err) => {
			console.error("dm:typing error:", err);
		});
	});

	// ── DM: MARK AS READ ────────────────────────────────────
	// Client emits when they view a conversation
	socket.on("dm:markRead", async ({ conversationId }) => {
		try {
			const conversation = await Conversation.findOne({
				_id: conversationId,
				participants: userId,
			});

			if (!conversation) return;

			// Mark messages from the other user as read
			await Message.updateMany(
				{
					conversation: conversationId,
					sender: { $ne: userId },
					isRead: false,
				},
				{ isRead: true }
			);

			// Reset unread count
			conversation.unreadCounts.set(userId, 0);
			await conversation.save();

			// Notify the other user (read receipts)
			const otherUserId = conversation.participants.find(
				(p) => String(p) !== userId
			);

			if (otherUserId) {
				io.to(`user:${otherUserId}`).emit("dm:read", {
					conversationId,
					readBy: userId,
				});
			}
		} catch (err) {
			console.error("dm:markRead error:", err);
		}
	});

	// ── DISCONNECT ──────────────────────────────────────────
	socket.on("disconnect", async (reason) => {
		console.log(`Socket disconnected: ${socket.user.username} (${reason})`);
		try {
			await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
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

const listener = server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

const shutdown = (signal) => {
	console.log(`\nReceived ${signal}. Closing server...`);

	listener.close(() => {
		console.log("HTTP server closed.");
		process.exit(0);
	});

	// Force exit after 5 seconds
	setTimeout(() => {
		console.error("Forcing exit after timeout");
		process.exit(1);
	}, 5000);
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
