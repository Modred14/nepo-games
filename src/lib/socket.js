/**
 * lib/socket.js
 *
 * BEFORE: getIO() read from global._io — only worked when Socket.io
 *         was on the same server as Next.js (now deleted).
 *
 * AFTER:  emitToRoom() sends an HTTP POST to the standalone Socket.io
 *         server running on Render. Next.js API routes just call this
 *         function — no Socket.io dependency on the Next.js side at all.
 */

export async function emitToRoom(room, event, data) {
  try {
    const socketServerUrl = process.env.SOCKET_SERVER_URL;

    if (!socketServerUrl) {
      console.warn("SOCKET_SERVER_URL not set — skipping socket emit");
      return;
    }

    await fetch(`${socketServerUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": process.env.SOCKET_SECRET,
      },
      body: JSON.stringify({ room, event, data }),
    });
  } catch (err) {
    // Non-critical — message is already saved in DB
    // Socket failure should never break the API response
    console.error("Socket emit failed (non-critical):", err.message);
  }
}