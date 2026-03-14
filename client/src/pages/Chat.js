/**
 * Chat — DM Hub
 *
 * Instagram/WhatsApp-style layout:
 * - Left sidebar: conversation list with avatars, last message, unread badges, online dots
 * - Right panel: active chat — received messages (left + avatar), sent messages (right, colored)
 * - New conversation: start DM with any connected user
 * - Mobile: full-screen toggle between sidebar and chat view
 *
 * Architecture:
 * - Sub-components: MessageBubble, ConversationItem, TypingIndicator, ChatHeader, NewChatModal
 * - All handlers wrapped in useCallback to prevent unnecessary re-renders
 * - currentUser memoized — never re-parsed from localStorage on every render
 * - Typing auto-clear stored in ref so it can be properly cancelled
 * - sendMessageAPI imported statically (not dynamically)
 *
 * Socket events: dm:send (ack), dm:receive, dm:typing, dm:read, dm:markRead
 */

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useSocket } from "../context/SocketProvider";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  getConnectionRequests,
  markConversationRead,
  sendMessageAPI,           // ✅ FIX: was being dynamically imported inside a callback
} from "../api/api";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Returns a compact human-readable time label for the sidebar.
 * e.g. "Now", "5m", "3h", "Yesterday", "Mon, Jan 6"
 */
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffMs = Date.now() - date;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return "Yesterday";

  // ✅ FIX: was truncated at line 396 — older dates now properly formatted
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Returns "9:41 AM" style time for message timestamps.
 */
function formatMessageTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Returns initials avatar letter from a user object.
 */
function getInitial(user) {
  return user?.name?.charAt(0) || user?.username?.charAt(0) || "?";
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

/**
 * UserAvatar — circular gradient avatar with optional online dot.
 */
const UserAvatar = memo(function UserAvatar({ user, size = "md", showOnlineDot = false }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  const dotSizes = { sm: "w-2.5 h-2.5", md: "w-3 h-3", lg: "w-3.5 h-3.5" };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold`}
      >
        {getInitial(user)}
      </div>
      {showOnlineDot && user?.isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-green-500 border-2 border-white rounded-full`}
        />
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────

/**
 * TypingIndicator — animated three-dot bubble shown when other user is typing.
 */
const TypingIndicator = memo(function TypingIndicator({ otherUser }) {
  return (
    <div className="flex items-end gap-2 mb-1">
      {/* Avatar aligned left, same as received messages */}
      <UserAvatar user={otherUser} size="sm" />
      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────

/**
 * MessageBubble — a single chat message.
 *
 * Layout:
 *   Received (isMine=false): [Avatar] [Gray bubble — left]
 *   Sent     (isMine=true):            [Blue bubble — right]
 */
const MessageBubble = memo(function MessageBubble({ message, isMine, otherUser, showAvatar }) {
  return (
    <div className={`flex items-end gap-2 mb-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — shown for received messages; invisible spacer for sent (keeps bubbles aligned) */}
      {!isMine ? (
        showAvatar
          ? <UserAvatar user={otherUser} size="sm" />
          : <div className="w-8 flex-shrink-0" /> /* spacer keeps column width consistent */
      ) : null}

      {/* Bubble */}
      <div
        className={`
          max-w-[72%] sm:max-w-[60%] px-3.5 py-2.5 shadow-sm
          ${isMine
            ? "bg-indigo-600 text-white rounded-2xl rounded-br-md"
            : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md"
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isMine ? "text-indigo-300" : "text-gray-400"}`}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isMine && (
            <span className={`text-[10px] ${message.isRead ? "text-indigo-300" : "text-indigo-400/50"}`}>
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────

/**
 * ConversationItem — a single row in the left sidebar.
 */
const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  isTyping,
  currentUserId,
  onClick,
}) {
  const other = conversation.otherUser;
  const { lastMessage, myUnread } = conversation;

  const lastMessagePreview = useMemo(() => {
    if (!lastMessage?.text) return null;
    const isMe = String(lastMessage.sender?._id || lastMessage.sender) === String(currentUserId);
    return { text: lastMessage.text, isMe };
  }, [lastMessage, currentUserId]);

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-100
        hover:bg-gray-50 active:bg-gray-100
        ${isActive ? "bg-indigo-50 border-l-4 border-l-indigo-600" : "border-l-4 border-l-transparent"}
      `}
    >
      <UserAvatar user={other} size="lg" showOnlineDot />

      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${myUnread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
            {other?.name || other?.username || "Unknown"}
          </p>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
            {formatRelativeTime(lastMessage?.createdAt)}
          </span>
        </div>

        {/* Preview + unread badge */}
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {isTyping ? (
              <span className="text-indigo-500 font-medium italic">typing…</span>
            ) : lastMessagePreview ? (
              <>
                {lastMessagePreview.isMe && <span className="text-gray-400">You: </span>}
                {lastMessagePreview.text}
              </>
            ) : (
              <span className="italic text-gray-400">No messages yet</span>
            )}
          </p>
          {myUnread > 0 && (
            <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded-full">
              {myUnread > 99 ? "99+" : myUnread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────

/**
 * ChatHeader — top bar of the active conversation.
 */
const ChatHeader = memo(function ChatHeader({
  conversation,
  isTyping,
  onBackClick,
}) {
  const other = conversation.otherUser;

  const statusText = useMemo(() => {
    if (isTyping) return { label: "typing…", className: "text-indigo-500 font-medium" };
    if (other?.isOnline) return { label: "Online", className: "text-green-500" };
    if (other?.lastSeen) return { label: `Last seen ${formatRelativeTime(other.lastSeen)}`, className: "text-gray-400" };
    return { label: "Offline", className: "text-gray-400" };
  }, [isTyping, other]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Back — mobile only */}
      <button
        onClick={onBackClick}
        className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Back to conversations"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <UserAvatar user={other} size="md" showOnlineDot />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {other?.name || other?.username || "Unknown"}
        </p>
        <p className={`text-xs ${statusText.className}`}>{statusText.label}</p>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────

/**
 * NewChatModal — overlay to start a conversation with a new connection.
 */
const NewChatModal = memo(function NewChatModal({
  isLoading,
  users,
  hasExistingConversations,
  onStartConversation,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">New Message</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="text-3xl block mb-3">🤝</span>
              <p className="text-sm text-gray-500">
                {hasExistingConversations
                  ? "You already have conversations with all your connections!"
                  : "Connect with other users first to start messaging."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => onStartConversation(user._id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

function Chat() {
  // ── STATE ──────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // { [conversationId]: { username } }
  const [typingUsers, setTypingUsers] = useState({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pagination, setPagination] = useState({ hasMore: false, page: 1 });

  // ── REFS ───────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // ✅ FIX: store typing auto-clear timeouts per conversation so they can be cancelled
  const typingClearTimeoutsRef = useRef({});

  // ── SOCKET ────────────────────────────────────────────────────
  const socketCtx = useSocket();
  const socket = socketCtx?.socket;
  const isConnected = socketCtx?.isConnected;
  const setUnreadDmCount = socketCtx?.setUnreadDmCount;
  const refreshUnreadDmCount = socketCtx?.refreshUnreadDmCount;
  const isChatOpenRef = socketCtx?.isChatOpenRef;

  // ── CURRENT USER (memoized) ────────────────────────────────────
  // Parsed once. Normalises _id → id so every comparison uses currentUser.id safely.
  // MongoDB returns _id; some auth libs map it to id. We handle both.
  const currentUser = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return { ...user, id: user.id || user._id };   // ✅ FIX Bug 1: normalise _id → id
  }, []);

  // ── HELPERS ───────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 50);
  }, []);

  // ── MARK CHAT PAGE AS OPEN (for badge suppression) ────────────
  useEffect(() => {
    if (isChatOpenRef) isChatOpenRef.current = true;
    // Reset badge immediately on mount
    if (setUnreadDmCount) setUnreadDmCount(0);
    if (refreshUnreadDmCount) refreshUnreadDmCount();

    return () => {
      if (isChatOpenRef) isChatOpenRef.current = false;
    };
  }, [isChatOpenRef, setUnreadDmCount, refreshUnreadDmCount]);

  // ── FETCH CONVERSATIONS ───────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const { data } = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("fetchConversations error:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── FETCH MESSAGES ────────────────────────────────────────────

  const fetchMessages = useCallback(
    async (conversationId, page = 1) => {
      try {
        setIsLoadingMessages(true);
        const { data } = await getMessages(conversationId, page);

        if (page === 1) {
          setMessages(data.messages);
          scrollToBottom("instant");
        } else {
          setMessages((prev) => [...data.messages, ...prev]);
        }

        setPagination({ hasMore: data.pagination.hasMore, page: data.pagination.page });
      } catch (err) {
        console.error("fetchMessages error:", err);
        toast.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  // ── OPEN CONVERSATION ─────────────────────────────────────────

  const openConversation = useCallback(
    async (conversation) => {
      setActiveConversation(conversation);
      setMessages([]);
      setPagination({ hasMore: false, page: 1 });
      setShowSidebar(false);

      await fetchMessages(conversation._id);

      if (conversation.myUnread > 0) {
        try {
          await markConversationRead(conversation._id);
          socket?.emit("dm:markRead", { conversationId: conversation._id });
          setConversations((prev) =>
            prev.map((c) => (c._id === conversation._id ? { ...c, myUnread: 0 } : c))
          );
          // Update the global unread DM badge
          if (refreshUnreadDmCount) refreshUnreadDmCount();
        } catch (err) {
          console.error("markConversationRead error:", err);
        }
      }
    },
    [fetchMessages, socket]
  );

  // ── LOAD OLDER MESSAGES ───────────────────────────────────────

  const loadOlderMessages = useCallback(() => {
    if (!activeConversation || !pagination.hasMore || isLoadingMessages) return;
    fetchMessages(activeConversation._id, pagination.page + 1);
  }, [activeConversation, pagination, isLoadingMessages, fetchMessages]);

  // ── SEND MESSAGE ──────────────────────────────────────────────

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !activeConversation || isSending) return;

    const text = messageText.trim();
    setMessageText("");
    setIsSending(true);

    // Stop typing indicator immediately
    socket?.emit("dm:typing", { conversationId: activeConversation._id, isTyping: false });

    const updateSidebarLastMessage = () => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? {
                ...c,
                lastMessage: {
                  text: text.substring(0, 100),
                  sender: { _id: currentUser.id, name: currentUser.name },
                  createdAt: new Date().toISOString(),
                },
              }
            : c
        )
      );
    };

    if (socket?.connected) {
      // Primary path: Socket.IO with acknowledgment callback
      socket.emit(
        "dm:send",
        { conversationId: activeConversation._id, text },
        (response) => {
          setIsSending(false);
          if (response?.error) {
            toast.error(response.error);
            setMessageText(text); // restore on failure
            return;
          }
          setMessages((prev) => [...prev, response.message]);
          scrollToBottom();
          updateSidebarLastMessage();
        }
      );
    } else {
      // Fallback path: REST API (socket disconnected)
      // ✅ FIX: sendMessageAPI is now a static import — no dynamic import needed
      sendMessageAPI(activeConversation._id, text)
        .then(({ data }) => {
          setMessages((prev) => [...prev, data]);
          scrollToBottom();
          updateSidebarLastMessage();
        })
        .catch(() => {
          toast.error("Failed to send message");
          setMessageText(text);
        })
        .finally(() => setIsSending(false));
    }
  }, [messageText, activeConversation, isSending, socket, scrollToBottom, currentUser]);

  // ── TYPING INDICATOR ──────────────────────────────────────────

  const handleTyping = useCallback(
    (e) => {
      setMessageText(e.target.value);
      if (!socket || !activeConversation) return;

      socket.emit("dm:typing", { conversationId: activeConversation._id, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("dm:typing", { conversationId: activeConversation._id, isTyping: false });
      }, 2000);
    },
    [socket, activeConversation]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // ── DM SOCKET EVENT LISTENERS ─────────────────────────────────
  //
  // ✅ FIX Bug 2: Attach listeners directly via socket.on/socket.off.
  //
  // Previously used dmListenersRef (a SocketProvider indirection) which silently
  // stopped working if the provider wasn't wired up or the socket reconnected.
  // Direct socket.on is self-contained, always live, and re-registers automatically
  // whenever `socket` or `activeConversation` changes.

  useEffect(() => {
    if (!socket) return;

    // ── dm:receive ───────────────────────────────────────────────
    const handleReceive = ({ message, conversationId }) => {
      const isCurrentConv = activeConversation?._id === conversationId;

      if (isCurrentConv) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        socket.emit("dm:markRead", { conversationId });
        markConversationRead(conversationId).catch(() => {});
      }

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversationId);
        if (!exists) {
          fetchConversations();   // brand-new conversation — refresh list
          return prev;
        }
        return prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: {
                  text: message.text?.substring(0, 100),
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                myUnread: isCurrentConv ? 0 : (c.myUnread || 0) + 1,
              }
            : c
        );
      });
    };

    // ── dm:typing ────────────────────────────────────────────────
    const handleTyping = ({ conversationId, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: true }));

        // Cancel previous auto-clear before setting a new one
        if (typingClearTimeoutsRef.current[conversationId]) {
          clearTimeout(typingClearTimeoutsRef.current[conversationId]);
        }
        typingClearTimeoutsRef.current[conversationId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
          delete typingClearTimeoutsRef.current[conversationId];
        }, 3000);
      } else {
        if (typingClearTimeoutsRef.current[conversationId]) {
          clearTimeout(typingClearTimeoutsRef.current[conversationId]);
          delete typingClearTimeoutsRef.current[conversationId];
        }
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      }
    };

    // ── dm:read ──────────────────────────────────────────────────
    const handleRead = ({ conversationId }) => {
      if (activeConversation?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.sender?._id || m.sender) === String(currentUser.id)
              ? { ...m, isRead: true }
              : m
          )
        );
      }
    };

    socket.on("dm:receive", handleReceive);
    socket.on("dm:typing", handleTyping);
    socket.on("dm:read", handleRead);

    // Capture snapshot for stable cleanup closure
    const pendingTypingTimeouts = typingClearTimeoutsRef.current;

    return () => {
      socket.off("dm:receive", handleReceive);
      socket.off("dm:typing", handleTyping);
      socket.off("dm:read", handleRead);
      Object.values(pendingTypingTimeouts).forEach(clearTimeout);
    };
  }, [socket, activeConversation, scrollToBottom, currentUser.id, fetchConversations]);

  // ── NEW CONVERSATION MODAL ────────────────────────────────────

  const openNewChatModal = useCallback(async () => {
    setShowNewChatModal(true);
    setLoadingConnections(true);
    try {
      const { data } = await getConnectionRequests("accepted");

      const users = data.map((conn) =>
        String(conn.from._id) === String(currentUser.id) ? conn.to : conn.from
      );

      const existingUserIds = new Set(conversations.map((c) => String(c.otherUser?._id)));
      setConnectedUsers(users.filter((u) => !existingUserIds.has(String(u._id))));
    } catch (err) {
      console.error("openNewChatModal error:", err);
      toast.error("Failed to load connections");
    } finally {
      setLoadingConnections(false);
    }
  }, [currentUser.id, conversations]);

  const startConversation = useCallback(
    async (userId) => {
      try {
        const { data } = await getOrCreateConversation(userId);
        setShowNewChatModal(false);
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === data._id);
          return exists ? prev : [data, ...prev];
        });
        openConversation(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to start conversation");
      }
    },
    [openConversation]
  );

  const closeNewChatModal = useCallback(() => setShowNewChatModal(false), []);

  // ── RENDER ────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100">

      {/* ── LEFT SIDEBAR ───────────────────────────────────────── */}
      <aside
        className={`
          ${showSidebar ? "flex" : "hidden"} md:flex
          flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h2 className="text-lg font-bold text-white">💬 Messages</h2>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
            <button
              onClick={openNewChatModal}
              className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
              title="New message"
              aria-label="New message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="text-4xl block mb-3" aria-hidden="true">💬</span>
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <button
                onClick={openNewChatModal}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={activeConversation?._id === conv._id}
                isTyping={Boolean(typingUsers[conv._id])}
                currentUserId={currentUser.id}
                onClick={() => openConversation(conv)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── RIGHT PANEL — Active Chat ───────────────────────────── */}
      <main
        className={`
          ${!showSidebar ? "flex" : "hidden"} md:flex
          flex-col flex-1 bg-gray-50
        `}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              isTyping={Boolean(typingUsers[activeConversation._id])}
              onBackClick={() => setShowSidebar(true)}
            />

            {/* Messages area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
            >
              {/* Load older messages */}
              {pagination.hasMore && (
                <div className="text-center py-2">
                  <button
                    onClick={loadOlderMessages}
                    disabled={isLoadingMessages}
                    className="px-4 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline disabled:text-gray-400"
                  >
                    {isLoadingMessages ? "Loading…" : "↑ Load older messages"}
                  </button>
                </div>
              )}

              {/* Loading state */}
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>

              /* Empty state */
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-4xl mb-3">👋</span>
                  <p className="text-sm">
                    Say hello to{" "}
                    <span className="font-medium text-gray-600">
                      {activeConversation.otherUser?.name || "them"}
                    </span>
                    !
                  </p>
                </div>

              /* Message list */
              ) : (
                messages.map((msg, idx) => {
                  const isMine =
                    String(msg.sender?._id || msg.sender) === String(currentUser.id);

                  // Show date separator when the day changes
                  const showDate =
                    idx === 0 ||
                    new Date(msg.createdAt).toDateString() !==
                      new Date(messages[idx - 1]?.createdAt).toDateString();

                  // Show avatar on the last message in a consecutive group from the same sender
                  const nextMsg = messages[idx + 1];
                  const isLastInGroup =
                    !nextMsg ||
                    String(nextMsg.sender?._id || nextMsg.sender) !==
                      String(msg.sender?._id || msg.sender);

                  return (
                    <div key={msg._id || idx}>
                      {showDate && (
                        <div className="flex items-center justify-center py-4">
                          <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      <MessageBubble
                        message={msg}
                        isMine={isMine}
                        otherUser={activeConversation.otherUser}
                        showAvatar={!isMine && isLastInGroup}
                      />
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUsers[activeConversation._id] && (
                <TypingIndicator otherUser={activeConversation.otherUser} />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message…"
                  rows={1}
                  disabled={!isConnected}
                  aria-label="Message input"
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-32 disabled:bg-gray-50"
                  style={{ minHeight: "42px" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !messageText.trim() || isSending}
                  aria-label="Send message"
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full transition-all shadow-sm"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected — empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <span className="text-6xl mb-4">💬</span>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Your Messages</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
              Select a conversation or start a new one with your connections
            </p>
            <button
              onClick={openNewChatModal}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              + New Message
            </button>
          </div>
        )}
      </main>

      {/* ── NEW CHAT MODAL ──────────────────────────────────────── */}
      {showNewChatModal && (
        <NewChatModal
          isLoading={loadingConnections}
          users={connectedUsers}
          hasExistingConversations={conversations.length > 0}
          onStartConversation={startConversation}
          onClose={closeNewChatModal}
        />
      )}
    </div>
  );
}

export default Chat;