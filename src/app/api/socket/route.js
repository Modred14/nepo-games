import { getIO } from "@/lib/socket";

export async function GET(req) {
  // Socket.io handles its own upgrade — this just initializes it
  if (!req.socket?.server?.io) {
    getIO(req.socket.server);
    req.socket.server.io = true;
  }
  return new Response("Socket ready", { status: 200 });
}