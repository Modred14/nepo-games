// server.js
//
// NOTE: this custom server is NOT what actually runs in production —
// package.json's "start" script runs `next start`, and fly.toml /
// Dockerfile's CMD follows that, so this file is currently dead code.
// Production chat goes through an external socket service
// (NEXT_PUBLIC_SOCKET_URL), which is NOT part of this repository. That
// service needs the equivalent of the fix below applied to it directly —
// this file is left here (a) in case you ever consolidate back onto a
// single Next.js custom server, and (b) as an exact reference for what to
// port over to the external service. The token-verification logic here
// matches src/lib/socketAuth.js / src/app/api/socket-token/route.js.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// FIX: was `cors: { origin: "*" }` — any website could open a socket
// connection to this server. Restrict to your actual site origin(s).
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function verifyJoinToken(token) {
  const secret = process.env.SOCKET_SECRET;
  if (!secret || !token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: ALLOWED_ORIGIN },
    addTrailingSlash: false,
  });

  global._io = io;

  io.on("connection", (socket) => {
    // FIX (critical): previously accepted a bare conversation id and put
    // the socket straight into `room:${conversationId}` with zero checks —
    // anyone who knew or guessed a conversation id could join it and read
    // every message broadcast to that room in real time, including
    // delivered game login credentials. Now requires a signed token
    // (issued by POST /api/socket-token, which itself checks DB
    // participant membership) whose payload room must match the room
    // being requested.
    socket.on("join", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const { room, token } = payload;
      if (!room || !token) return;

      const decoded = verifyJoinToken(token);
      if (!decoded || decoded.room !== room) {
        console.warn("Socket join rejected — invalid/mismatched token for room:", room);
        return;
      }

      socket.join(room);
    });

    socket.on("leave", (payload) => {
      const room = typeof payload === "object" ? payload?.room : payload;
      if (room) socket.leave(room);
    });
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});