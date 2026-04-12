import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ join chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log("Joined room:", chatId);
  });

  // ✅ receive + broadcast message
  socket.on("send_message", (message) => {
    console.log("Message received:", message);

    // 🔥 send to ONLY that chat room
    io.to(message.chatId).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log("Socket server running on port 3001");
});