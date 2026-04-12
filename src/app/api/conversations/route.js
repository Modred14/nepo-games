import pool from "../../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return Response.json({ error: "Missing user_id" }, { status: 400 });
    }

    const conversations = await pool.query(
      `
SELECT 
  c.id,
  c.listing_id,

  u.username,
  u.profile_image,
  u.email,

  COALESCE(
  l.title || ' (' || COALESCE(l.platform, '') || ')',
  l.title,
  'Unknown Game'
) AS gameDetails,

  m.message AS lastMessage,
  m.created_at AS lastMessageTime,

  CASE 
    WHEN c.sender_id = $1 THEN c.receiver_id
    ELSE c.sender_id
  END AS receiver_id

FROM conversations c

LEFT JOIN users u 
  ON u.id = CASE 
    WHEN c.sender_id = $1 THEN c.receiver_id
    ELSE c.sender_id
  END

LEFT JOIN listings l 
  ON l.id = c.listing_id

LEFT JOIN LATERAL (
  SELECT *
  FROM messages
  WHERE conversation_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true

WHERE c.sender_id = $1 OR c.receiver_id = $1

ORDER BY m.created_at DESC NULLS LAST;
`,
      [user_id],
    );
    return Response.json(conversations.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
