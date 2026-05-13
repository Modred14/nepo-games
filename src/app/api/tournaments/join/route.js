import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(user)

    const { tournament_id } = await req.json();

    if (!tournament_id) {
      return Response.json({ error: "Missing tournament_id" }, { status: 400 });
    }

    // 1. Get tournament
    const tournamentRes = await pool.query(
      `SELECT * FROM tournaments WHERE id = $1`,
      [tournament_id],
    );
    const tournament = tournamentRes.rows[0];

    if (!tournament) {
      return Response.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.slots_left <= 0) {
      return Response.json({ error: "No slots available" }, { status: 400 });
    }

    if (tournament.status === "closed") {
      return Response.json({ error: "Tournament is closed" }, { status: 400 });
    }

    const nairaAmount =
      parseInt(tournament.entry_fee.replace(/[^0-9]/g, "")) || 0;

    if (nairaAmount === 0) {
      return Response.json({ error: "" }, { status: 400 });
    }
    const nairaAmountCharge = nairaAmount * 1.125;
    const koboAmount = nairaAmountCharge * 100;
    // 2. Prevent duplicate registration
    const existing = await pool.query(
      `SELECT id FROM tournament_contestants 
       WHERE tournament_id = $1 AND user_id = $2`,
      [tournament_id, user.id],
    );
    if (existing.rows.length > 0) {
      return Response.json({ error: "Already registered" }, { status: 409 });
    }

    // 3. Initialize Paystack
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: koboAmount, // ₦1,000 in kobo
          reference: `tournament_${tournament_id}_${user.id}_${Date.now()}`,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tournament`,
          metadata: {
            userId: user.id,
            purpose: "tournament",
            tournament_id,
            player_name: user.username,
            player_email: user.email,
          },
        }),
      },
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return Response.json({ error: "Payment init failed" }, { status: 500 });
    }

    return Response.json({
      authorization_url: paystackData.data.authorization_url,
    });
  } catch (err) {
    console.error("POST /api/tournaments/join error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
