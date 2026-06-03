export async function emitToRoom(room, event, data) {
  const socketServerUrl = process.env.SOCKET_SERVER_URL;

  console.log("[emitToRoom] called:", { room, event, socketServerUrl });

  if (!socketServerUrl) {
    console.error("[emitToRoom] ERROR: SOCKET_SERVER_URL is not set!");
    return;
  }

  const secret = process.env.SOCKET_SECRET;
  if (!secret) {
    console.error("[emitToRoom] ERROR: SOCKET_SECRET is not set!");
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
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[emitToRoom] Emit failed:", res.status, text);
    } else {
      console.log("[emitToRoom] Emit success:", res.status, room, event);
    }
  } catch (err) {
    console.error("[emitToRoom] Fetch threw an error:", err.message);
  }
}