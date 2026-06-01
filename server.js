const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: "*" },
    addTrailingSlash: false,
  });

  global._io = io;

  io.on("connection", (socket) => {
    socket.on("join", (conversationId) => {
      socket.join(`room:${conversationId}`);
    });
    socket.on("leave", (conversationId) => {
      socket.leave(`room:${conversationId}`);
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});