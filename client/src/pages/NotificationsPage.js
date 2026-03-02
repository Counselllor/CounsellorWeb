/**
 * Notifications Page
 * Full-page view of all notifications with filtering, pagination,
 * and inline accept/reject for connection requests.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSocket } from "../context/SocketProvider";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptConnectionRequest,
    rejectConnectionRequest,
} from "../api/api";
import Footer from "../components/Footer";

function NotificationsPage() {
    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();
    const socketCtx = useSocket();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // "all" | "unread" | "connection_request"
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState({}); // { [notificationId]: true }

    // Fetch notifications from API
    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        try {
            setIsLoading(true);
            const unreadOnly = filter === "unread" ? true : undefined;
            const { data } = await getNotifications(pageNum, 15, unreadOnly);

            let items = data.notifications;
            // Client-side filter for connection_request type
            if (filter === "connection_request") {
                items = items.filter((n) => n.type === "connection_request");
            }

            if (append) {
                setNotifications((prev) => [...prev, ...items]);
            } else {
                setNotifications(items);
            }
            setHasMore(data.pagination.hasMore);
            setTotal(data.pagination.total);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    // Fetch on mount and when filter changes
    useEffect(() => {
        setPage(1);
        fetchNotifications(1);
    }, [fetchNotifications]);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socketCtx?.socket) return;

        const handleNewNotification = (notification) => {
            // Add to top of list if it matches current filter
            const matchesFilter =
                filter === "all" ||
                (filter === "unread" && !notification.isRead) ||
                (filter === "connection_request" && notification.type === "connection_request");

            if (matchesFilter) {
                setNotifications((prev) => [notification, ...prev]);
                setTotal((prev) => prev + 1);
            }
        };

        socketCtx.socket.on("notification", handleNewNotification);
        return () => socketCtx.socket.off("notification", handleNewNotification);
    }, [socketCtx?.socket, filter]);

    // Load more
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage, true);
    };

    // Mark single as read
    const handleMarkRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            if (socketCtx) {
                socketCtx.setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            if (socketCtx) {
                socketCtx.setUnreadCount(0);
            }
            toast.success("All notifications marked as read");
        } catch (err) {
            console.error("Error:", err);
            toast.error("Failed to mark all as read");
        }
    };

    // Accept connection request
    const handleAccept = async (notification) => {
        if (!notification.relatedId) return;
        setActionLoading((prev) => ({ ...prev, [notification._id]: true }));

        try {
            await acceptConnectionRequest(notification.relatedId);
            toast.success("Connection request accepted! 🎉");

            // Mark notification as read
            if (!notification.isRead) {
                await markNotificationAsRead(notification._id);
                if (socketCtx) {
                    socketCtx.setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            }

            // Update local state — change message to reflect acceptance
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notification._id
                        ? { ...n, isRead: true, type: "connection_accepted", _actionTaken: "accepted" }
                        : n
                )
            );
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to accept request";
            toast.error(msg);
        } finally {
            setActionLoading((prev) => ({ ...prev, [notification._id]: false }));
        }
    };

    // Reject connection request
    const handleReject = async (notification) => {
        if (!notification.relatedId) return;
        setActionLoading((prev) => ({ ...prev, [notification._id]: true }));

        try {
            await rejectConnectionRequest(notification.relatedId);
            toast.info("Connection request declined");

            if (!notification.isRead) {
                await markNotificationAsRead(notification._id);
                if (socketCtx) {
                    socketCtx.setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            }

            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notification._id
                        ? { ...n, isRead: true, type: "connection_rejected", _actionTaken: "rejected" }
                        : n
                )
            );
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reject request";
            toast.error(msg);
        } finally {
            setActionLoading((prev) => ({ ...prev, [notification._id]: false }));
        }
    };

    // Format relative time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Notification type icon
    const getIcon = (type) => {
        switch (type) {
            case "connection_request": return "🔗";
            case "connection_accepted": return "✅";
            case "connection_rejected": return "❌";
            default: return "🔔";
        }
    };

    // Filter tabs
    const filters = [
        { key: "all", label: "All", icon: "📋" },
        { key: "unread", label: "Unread", icon: "🔵" },
        { key: "connection_request", label: "Requests", icon: "🔗" },
    ];

    const unreadCountLocal = notifications.filter((n) => !n.isRead).length;

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                🔔 Notifications
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {total} total · {unreadCountLocal} unread on this page
                            </p>
                        </div>

                        {unreadCountLocal > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="self-start sm:self-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                ✓ Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.key
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <span aria-hidden="true">{f.icon}</span>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Notification List */}
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <span className="text-5xl block mb-4" aria-hidden="true">🔔</span>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                No notifications
                            </h3>
                            <p className="text-sm text-gray-500">
                                {filter === "unread"
                                    ? "You've read all your notifications!"
                                    : filter === "connection_request"
                                        ? "No connection requests yet"
                                        : "When someone sends you a request, you'll see it here"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`bg-white rounded-xl border transition-all hover:shadow-md ${!notification.isRead
                                        ? "border-blue-200 bg-blue-50/50 shadow-sm"
                                        : "border-gray-200"
                                        }`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* Sender Avatar */}
                                            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                                                {notification.sender?.name?.charAt(0) ||
                                                    notification.sender?.username?.charAt(0) || "?"}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Message */}
                                                <p className={`text-sm ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                                    <span className="mr-1.5" aria-hidden="true">
                                                        {getIcon(notification._actionTaken ? `connection_${notification._actionTaken}` : notification.type)}
                                                    </span>
                                                    {notification._actionTaken === "accepted"
                                                        ? `You accepted ${notification.sender?.name || notification.sender?.username}'s request`
                                                        : notification._actionTaken === "rejected"
                                                            ? `You declined ${notification.sender?.name || notification.sender?.username}'s request`
                                                            : notification.message}
                                                </p>

                                                {/* Time + Read status */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkRead(notification._id)}
                                                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Inline Actions for Connection Requests */}
                                                {notification.type === "connection_request" &&
                                                    !notification._actionTaken && (
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => handleAccept(notification)}
                                                                disabled={actionLoading[notification._id]}
                                                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
                                                            >
                                                                {actionLoading[notification._id]
                                                                    ? "..."
                                                                    : "✓ Accept"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(notification)}
                                                                disabled={actionLoading[notification._id]}
                                                                className="px-4 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                                                            >
                                                                {actionLoading[notification._id]
                                                                    ? "..."
                                                                    : "✗ Decline"}
                                                            </button>
                                                        </div>
                                                    )}

                                                {/* Action taken badge */}
                                                {notification._actionTaken && (
                                                    <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${notification._actionTaken === "accepted"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {notification._actionTaken === "accepted" ? "✓ Accepted" : "✗ Declined"}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Unread dot */}
                                            {!notification.isRead && (
                                                <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Load More */}
                            {hasMore && (
                                <div className="text-center pt-4">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                                                Loading...
                                            </span>
                                        ) : (
                                            "Load more notifications"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default NotificationsPage;
