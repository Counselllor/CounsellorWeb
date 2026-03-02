/**
 * SocketProvider — Global Socket.IO Context
 *
 * DESIGN DECISION: One Socket.IO connection for the entire app.
 *
 * WHY?
 * - A global provider connects once on login, stays connected across all pages,
 *   and cleans up on logout. Every page gets real-time events.
 *
 * WHAT IT PROVIDES:
 * - socket: the Socket.IO client instance
 * - isConnected: connection status
 * - unreadCount: notification badge count
 * - notifications: recent notifications array
 * - dmEvents: DM event emitter for Chat.js to subscribe
 * - refreshUnreadCount: re-fetch notification count from server
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../api/api";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const socketRef = useRef(null);

    // DM event listeners — Chat.js subscribes/unsubscribes via these refs
    const dmListenersRef = useRef({
        onReceive: null,  // (data) => {} — new DM received
        onTyping: null,   // (data) => {} — typing indicator
        onRead: null,     // (data) => {} — read receipt
    });

    // Fetch unread count from REST API (initial load + manual refresh)
    const refreshUnreadCount = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${SOCKET_URL}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    }, []);

    // Setup socket connection with all event handlers
    const setupSocket = useCallback((token) => {
        const socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketInstance.on("connect", () => {
            console.log("🔌 Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            setIsConnected(false);
            if (error.message.includes("Authentication") || error.message.includes("token")) {
                socketInstance.disconnect();
            }
        });

        // ── NOTIFICATION HANDLER ────────────────────────────────
        socketInstance.on("notification", (notification) => {
            setNotifications((prev) => [notification, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);

            const toastMessage = notification.message || "You have a new notification";
            if (notification.type === "connection_request") {
                toast.info(`🔗 ${toastMessage}`, { autoClose: 5000 });
            } else if (notification.type === "connection_accepted") {
                toast.success(`✅ ${toastMessage}`, { autoClose: 5000 });
            } else if (notification.type === "connection_rejected") {
                toast.info(toastMessage, { autoClose: 4000 });
            } else {
                toast.info(toastMessage);
            }
        });

        // ── DM: RECEIVE MESSAGE ─────────────────────────────────
        // Fires when another user sends us a DM
        socketInstance.on("dm:receive", (data) => {
            // Forward to Chat.js if it's listening
            if (dmListenersRef.current.onReceive) {
                dmListenersRef.current.onReceive(data);
            } else {
                // Chat.js not open — show a toast notification
                const senderName = data.message?.sender?.name || data.message?.sender?.username || "Someone";
                toast.info(`💬 ${senderName}: ${data.message?.text?.substring(0, 50)}...`, {
                    autoClose: 4000,
                });
            }
        });

        // ── DM: TYPING INDICATOR ────────────────────────────────
        socketInstance.on("dm:typing", (data) => {
            if (dmListenersRef.current.onTyping) {
                dmListenersRef.current.onTyping(data);
            }
        });

        // ── DM: READ RECEIPT ────────────────────────────────────
        socketInstance.on("dm:read", (data) => {
            if (dmListenersRef.current.onRead) {
                dmListenersRef.current.onRead(data);
            }
        });

        return socketInstance;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Connect socket when user is logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Prevent duplicate connections
        if (socketRef.current?.connected) return;

        const socketInstance = setupSocket(token);
        socketRef.current = socketInstance;
        setSocket(socketInstance);
        refreshUnreadCount();

        return () => {
            socketInstance.disconnect();
            socketRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-connect on auth changes (login/logout)
    useEffect(() => {
        const handleAuthChange = () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
                setUnreadCount(0);
                setNotifications([]);
            }

            const token = localStorage.getItem("token");
            if (token) {
                setTimeout(() => {
                    const socketInstance = setupSocket(token);
                    socketRef.current = socketInstance;
                    setSocket(socketInstance);
                    refreshUnreadCount();
                }, 100);
            }
        };

        window.addEventListener("auth-change", handleAuthChange);
        return () => window.removeEventListener("auth-change", handleAuthChange);
    }, [setupSocket, refreshUnreadCount]);

    const value = {
        socket,
        isConnected,
        unreadCount,
        setUnreadCount,
        notifications,
        setNotifications,
        refreshUnreadCount,
        // DM listener registration — Chat.js uses these
        dmListenersRef,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketProvider;
