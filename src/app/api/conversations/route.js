import pool from "../../../lib/db";
import { getCached, setCached, invalidateCache } from "@/lib/cache";
import { requireUser } from "../../../lib/auth";

export async function GET(req) {
  try {
    const user = await requireUser();
    const cacheKey = `conversations:${user_id}`;
    const cached = await getCached(cacheKey);
    if (cached) return Response.json(cached);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = user.id;
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
  u.plan,

  l.price AS price,
  l.status AS status,
  l.processing_by AS processing_by,

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
  END AS receiver_id,

COUNT(m2.id) FILTER (
  WHERE m2.created_at > COALESCE(cr.last_read_at, '1970-01-01')
  AND m2.sender_id != $1
) AS unreadcount

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

LEFT JOIN messages m2 
  ON m2.conversation_id = c.id


LEFT JOIN conversation_reads cr
  ON cr.conversation_id = c.id
 AND cr.user_id = $1


WHERE c.sender_id = $1 OR c.receiver_id = $1

GROUP BY 
  c.id,
  u.username,
  u.profile_image,
  u.email, 
  u.plan,
  l.title,
  l.platform,
  l.price,
  l.status,
  l.processing_by,
  m.message,
  m.created_at,
  cr.last_read_at

ORDER BY m.created_at DESC NULLS LAST;
`,
      [user_id],
    );

    await setCached(cacheKey, conversations.rows, 15); // 15 second TTL
    return Response.json(conversations.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
