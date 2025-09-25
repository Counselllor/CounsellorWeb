require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const collegeRoutes = require("./routes/collegeRoutes");
const studentRoutes = require("./routes/studentRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const authRoutes = require("./routes/authRoutes");



const connectDB = require("./config/db");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB if MONGO_URI is provided. This avoids crashing the server
// when running locally without a database configured.
if (process.env.MONGO_URI) {
	connectDB();
} else {
	console.warn("⚠️  MONGO_URI not set — skipping database connection");
}

// Example route
app.get("/login", (req, res) => {
	res.json({ message: "API running" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/colleges", require("./routes/collegeRoutes"));
// app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/connections", connectionRoutes);


// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.CLIENT_ORIGIN || "*",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log("🔌 New socket connected:", socket.id);

	socket.on("message", (payload) => {
		// Echo the message to all connected clients (example)
		io.emit("message", payload);
	});

	socket.on("disconnect", (reason) => {
		console.log(`Socket disconnected: ${socket.id} (${reason})`);
	});
});

const PORT = process.env.PORT || 5000;

const listener = server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown handlers
const shutdown = (signal) => {
	console.log(`\nReceived ${signal}. Closing server...`);
	listener.close(() => {
		console.log("HTTP server closed.");
		// If you need to close DB connections, do it here.
		process.exit(0);
	});
	// Force exit after 5s
	setTimeout(() => process.exit(1), 5000);
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
