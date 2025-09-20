const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ File where chats will be saved
const chatFile = path.join(__dirname, "chats.json");

// ✅ Load existing chats from file if available
let messages = [];
if (fs.existsSync(chatFile)) {
  try {
    messages = JSON.parse(fs.readFileSync(chatFile, "utf8"));
  } catch (err) {
    console.error("❌ Error reading chats.json:", err);
    messages = [];
  }
}

// ✅ Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Default route → open login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ✅ Explicit route for message.html
app.get("/message", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "message.html"));
});

// ✅ Socket.IO events
io.on("connection", (socket) => {
  console.log("✅ New user connected");

  // Send chat history when user joins
  socket.emit("chatHistory", messages);

  // Listen for new messages
  socket.on("chatMessage", (data) => {
    messages.push(data);

    // Save messages to file
    fs.writeFileSync(chatFile, JSON.stringify(messages, null, 2));

    // Broadcast new message
    io.emit("chatMessage", data);
  });

  // Typing indicator
  socket.on("typing", (user) => {
    socket.broadcast.emit("showTyping", user);
  });

  socket.on("stopTyping", (user) => {
    socket.broadcast.emit("hideTyping", user);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// ✅ Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
