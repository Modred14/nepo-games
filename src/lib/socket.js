import { Server } from "socket.io";

let io;

export function getIO(server) {
  if (!io) {
    io = new Server(server, {
      cors: { origin: "*" },
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      // User joins their conversation room
      socket.on("join", (conversationId) => {
        socket.join(`room:${conversationId}`);
      });

      socket.on("leave", (conversationId) => {
        socket.leave(`room:${conversationId}`);
      });

      socket.on("disconnect", () => {});
    });
  }
  return io;
}