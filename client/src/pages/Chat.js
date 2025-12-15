import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../api/api";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to chat server");
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from chat server");
    });

    socketRef.current.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = useCallback(() => {
    if (!message.trim() || !socketRef.current) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const payload = {
      text: message.trim(),
      user: user?.username || "Anonymous",
      timestamp: new Date().toISOString(),
    };
    socketRef.current.emit("message", payload);
    setMessage("");
  }, [message]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Chat Room</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </span>
      </div>

      <div className="border rounded-lg bg-gray-50 h-96 overflow-y-auto p-4 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="mb-3 p-2 bg-white rounded shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-600">{msg.user}</span>
                {msg.timestamp && (
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-gray-700 mt-1">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type message..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !message.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;