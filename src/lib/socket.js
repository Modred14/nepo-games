// ROUTE: src/lib/socket.js
// src/lib/socket.js
// Pushes a real-time event to the external socket service.
// Never throws: a failed notification must not undo a committed DB change.
export async function emitToRoom(room, event, data) {
  const socketServerUrl = process.env.SOCKET_SERVER_URL;
  const secret = process.env.SOCKET_SECRET;

  if (!socketServerUrl || !secret) {
    console.error("[emitToRoom] SOCKET_SERVER_URL / SOCKET_SECRET not configured");
    return;
  }

  try {
    const res = await fetch(`${socketServerUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": secret,
      },
      body: JSON.stringify({ room, event, data }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Status only — never log the payload (it can contain chat content).
      console.error("[emitToRoom] emit failed:", res.status, event);
    }
  } catch (err) {
    console.error("[emitToRoom] request failed:", err.message);
  }
}
