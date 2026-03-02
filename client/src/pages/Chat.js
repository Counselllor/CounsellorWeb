/**
 * Chat — DM Hub
 *
 * WhatsApp-style layout:
 * - Left sidebar: conversation list with avatars, last message, unread badges, online dots
 * - Right panel: active chat with message bubbles, timestamps, typing indicator
 * - New conversation: start DM with any connected user
 * - Mobile: full-screen toggle between sidebar and chat view
 *
 * Uses SocketProvider context — no separate Socket.IO connection.
 * Real-time: dm:send (with acknowledgment callback), dm:receive, dm:typing, dm:read
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketProvider";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  getConnectionRequests,
  markConversationRead,
} from "../api/api";
import { toast } from "react-toastify";

function Chat() {
  // ── STATE ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { username, timeout } }
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // mobile toggle
  const [pagination, setPagination] = useState({ hasMore: false, page: 1 });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  const socketCtx = useSocket();
  const socket = socketCtx?.socket;
  const isConnected = socketCtx?.isConnected;

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // ── SCROLL TO BOTTOM ──────────────────────────────────────
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // ── FETCH CONVERSATIONS ───────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const { data } = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── FETCH MESSAGES FOR ACTIVE CONVERSATION ────────────────
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      setIsLoadingMessages(true);
      const { data } = await getMessages(conversationId, page);
      if (page === 1) {
        setMessages(data.messages);
        scrollToBottom("instant");
      } else {
        setMessages((prev) => [...data.messages, ...prev]);
      }
      setPagination({
        hasMore: data.pagination.hasMore,
        page: data.pagination.page,
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [scrollToBottom]);

  // ── OPEN CONVERSATION ─────────────────────────────────────
  const openConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setPagination({ hasMore: false, page: 1 });
    setShowSidebar(false); // mobile: switch to chat view

    await fetchMessages(conversation._id);

    // Mark as read
    if (conversation.myUnread > 0) {
      try {
        await markConversationRead(conversation._id);
        // Also emit via socket for real-time read receipts
        if (socket) {
          socket.emit("dm:markRead", { conversationId: conversation._id });
        }
        // Update local unread
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversation._id ? { ...c, myUnread: 0 } : c
          )
        );
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    }
  }, [fetchMessages, socket]);

  // ── LOAD OLDER MESSAGES ───────────────────────────────────
  const loadOlderMessages = () => {
    if (!activeConversation || !pagination.hasMore || isLoadingMessages) return;
    fetchMessages(activeConversation._id, pagination.page + 1);
  };

  // ── SEND MESSAGE ──────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !activeConversation || isSending) return;

    const text = messageText.trim();
    setMessageText("");
    setIsSending(true);

    // Clear typing indicator
    if (socket) {
      socket.emit("dm:typing", {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }

    if (socket?.connected) {
      // Primary path: Send via Socket.IO with acknowledgment
      socket.emit(
        "dm:send",
        { conversationId: activeConversation._id, text },
        (response) => {
          setIsSending(false);
          if (response?.error) {
            toast.error(response.error);
            setMessageText(text); // restore message on failure
            return;
          }
          // Add message to local state
          setMessages((prev) => [...prev, response.message]);
          scrollToBottom();

          // Update conversation sidebar
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
        }
      );
    } else {
      // Fallback: REST API (socket disconnected)
      import("../api/api").then(({ sendMessageAPI }) => {
        sendMessageAPI(activeConversation._id, text)
          .then(({ data }) => {
            setMessages((prev) => [...prev, data]);
            scrollToBottom();
          })
          .catch(() => {
            toast.error("Failed to send message");
            setMessageText(text);
          })
          .finally(() => setIsSending(false));
      });
    }
  }, [messageText, activeConversation, isSending, socket, scrollToBottom, currentUser.id, currentUser.name]);

  // ── TYPING INDICATOR ──────────────────────────────────────
  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!socket || !activeConversation) return;

    // Emit typing start
    socket.emit("dm:typing", {
      conversationId: activeConversation._id,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("dm:typing", {
        conversationId: activeConversation._id,
        isTyping: false,
      });
    }, 2000);
  };

  // ── KEY PRESS ─────────────────────────────────────────────
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── DM EVENT LISTENERS (register with SocketProvider) ─────
  useEffect(() => {
    if (!socketCtx?.dmListenersRef) return;

    // On receive DM
    socketCtx.dmListenersRef.current.onReceive = (data) => {
      const { message, conversationId } = data;

      // If this conversation is currently open, add message and mark read
      if (activeConversation?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();

        // Mark as read since we're looking at it
        if (socket) {
          socket.emit("dm:markRead", { conversationId });
        }
        markConversationRead(conversationId).catch(() => { });
      }

      // Update conversation sidebar
      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);
        if (existing) {
          return prev.map((c) =>
            c._id === conversationId
              ? {
                ...c,
                lastMessage: {
                  text: message.text?.substring(0, 100),
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                myUnread:
                  activeConversation?._id === conversationId
                    ? 0
                    : (c.myUnread || 0) + 1,
              }
              : c
          );
        } else {
          // New conversation — refresh list
          fetchConversations();
          return prev;
        }
      });
    };

    // On typing indicator
    socketCtx.dmListenersRef.current.onTyping = (data) => {
      const { conversationId, username, isTyping } = data;

      if (isTyping) {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: { username },
        }));

        // Auto-clear after 3 seconds (in case stop event is missed)
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
        }, 3000);
      } else {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      }
    };

    // On read receipt
    socketCtx.dmListenersRef.current.onRead = (data) => {
      const { conversationId } = data;
      if (activeConversation?._id === conversationId) {
        // Mark all our sent messages as read
        setMessages((prev) =>
          prev.map((m) =>
            String(m.sender?._id || m.sender) === String(currentUser.id)
              ? { ...m, isRead: true }
              : m
          )
        );
      }
    };

    // Cleanup on unmount
    return () => {
      if (socketCtx?.dmListenersRef?.current) {
        socketCtx.dmListenersRef.current.onReceive = null;
        socketCtx.dmListenersRef.current.onTyping = null;
        socketCtx.dmListenersRef.current.onRead = null;
      }
    };
  }, [socketCtx, activeConversation, socket, scrollToBottom, currentUser.id, fetchConversations]);

  // ── NEW CONVERSATION MODAL ────────────────────────────────
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingConnections(true);
    try {
      const { data } = await getConnectionRequests("accepted");
      // Extract the other user from each accepted connection
      const users = data.map((conn) => {
        const other =
          String(conn.from._id) === String(currentUser.id)
            ? conn.to
            : conn.from;
        return other;
      });

      // Filter out users who already have conversations
      const existingUserIds = new Set(
        conversations.map((c) => String(c.otherUser?._id))
      );
      const newUsers = users.filter(
        (u) => !existingUserIds.has(String(u._id))
      );

      setConnectedUsers(newUsers);
    } catch (err) {
      console.error("Error fetching connections:", err);
      toast.error("Failed to load connections");
    } finally {
      setLoadingConnections(false);
    }
  };

  const startConversation = async (userId) => {
    try {
      const { data } = await getOrCreateConversation(userId);
      setShowNewChatModal(false);

      // Add to conversations if not already there
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });

      // Open the conversation
      openConversation(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start conversation";
      toast.error(msg);
    }
  };

  // ── FORMAT TIME ───────────────────────────────────────────
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100">

      {/* ════════════════════════════════════════════════════
           LEFT SIDEBAR — Conversation List
           ════════════════════════════════════════════════════ */}
      <div
        className={`${showSidebar ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-200`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            💬 Messages
          </h2>
          <div className="flex items-center gap-2">
            {/* Connection status dot */}
            <span
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
            {/* New Chat Button */}
            <button
              onClick={openNewChatModal}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors"
              title="New message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="text-4xl block mb-3" aria-hidden="true">💬</span>
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <button
                onClick={openNewChatModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeConversation?._id === conv._id;
              const typing = typingUsers[conv._id];

              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-100 hover:bg-gray-50 ${isActive ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                >
                  {/* Avatar with online dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {other?.name?.charAt(0) || other?.username?.charAt(0) || "?"}
                    </div>
                    {other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {other?.name || other?.username || "Unknown"}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate">
                        {typing ? (
                          <span className="text-blue-500 font-medium italic">typing...</span>
                        ) : conv.lastMessage?.text ? (
                          <>
                            {String(conv.lastMessage.sender?._id || conv.lastMessage.sender) === String(currentUser.id) && (
                              <span className="text-gray-400">You: </span>
                            )}
                            {conv.lastMessage.text}
                          </>
                        ) : (
                          <span className="italic text-gray-400">No messages yet</span>
                        )}
                      </p>
                      {/* Unread badge */}
                      {conv.myUnread > 0 && (
                        <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-blue-600 rounded-full">
                          {conv.myUnread > 99 ? "99+" : conv.myUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
           RIGHT PANEL — Active Chat
           ════════════════════════════════════════════════════ */}
      <div
        className={`${!showSidebar ? "flex" : "hidden"
          } md:flex flex-col flex-1 bg-gray-50`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
              {/* Back button (mobile) */}
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* User avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {activeConversation.otherUser?.name?.charAt(0) ||
                    activeConversation.otherUser?.username?.charAt(0) || "?"}
                </div>
                {activeConversation.otherUser?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {activeConversation.otherUser?.name ||
                    activeConversation.otherUser?.username || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  {typingUsers[activeConversation._id] ? (
                    <span className="text-blue-500 font-medium">typing...</span>
                  ) : activeConversation.otherUser?.isOnline ? (
                    <span className="text-green-500">Online</span>
                  ) : activeConversation.otherUser?.lastSeen ? (
                    `Last seen ${formatTime(activeConversation.otherUser.lastSeen)}`
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
            >
              {/* Load older messages */}
              {pagination.hasMore && (
                <div className="text-center py-2">
                  <button
                    onClick={loadOlderMessages}
                    disabled={isLoadingMessages}
                    className="px-4 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline disabled:text-gray-400"
                  >
                    {isLoadingMessages ? "Loading..." : "↑ Load older messages"}
                  </button>
                </div>
              )}

              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-4xl mb-3">👋</span>
                  <p className="text-sm">
                    Say hello to {activeConversation.otherUser?.name || "them"}!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(currentUser.id);
                  const showDate = idx === 0 || (
                    new Date(msg.createdAt).toDateString() !==
                    new Date(messages[idx - 1]?.createdAt).toDateString()
                  );

                  return (
                    <div key={msg._id || idx}>
                      {/* Date separator */}
                      {showDate && (
                        <div className="flex items-center justify-center py-3">
                          <span className="px-3 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl shadow-sm ${isMine
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {/* Read receipt — double check for sent messages */}
                            {isMine && (
                              <span className={`text-[10px] ${msg.isRead ? "text-blue-200" : "text-blue-300/50"}`}>
                                {msg.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUsers[activeConversation._id] && (
                <div className="flex justify-start mb-1">
                  <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                  disabled={!isConnected}
                  style={{ minHeight: "42px" }}
                  onInput={(e) => {
                    // Auto-resize textarea
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !messageText.trim() || isSending}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition-all shadow-sm"
                  title="Send message"
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
          /* No conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <span className="text-6xl mb-4">💬</span>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Your Messages</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
              Select a conversation or start a new one with your connections
            </p>
            <button
              onClick={openNewChatModal}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              + New Message
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
           NEW CHAT MODAL
           ════════════════════════════════════════════════════ */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">New Message</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConnections ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : connectedUsers.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <span className="text-3xl block mb-2">🤝</span>
                  <p className="text-sm text-gray-500">
                    {conversations.length > 0
                      ? "You already have conversations with all your connections!"
                      : "Connect with other users first to start messaging"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {connectedUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => startConversation(user._id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.name?.charAt(0) || user.username?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name || user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;