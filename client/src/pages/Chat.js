import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Replace with Render URL later

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const payload = {
      text: message,
      user: user?.username,
    };
    socket.emit("message", payload);
    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat Room</h2>
      <div style={{ border: "1px solid black", height: "300px", overflow: "auto", marginBottom: "10px" }}>
        {messages.map((msg, i) => (
          <p key={i}><b>{msg.user}</b>: {msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;