// ORIGINAL ROUTE: src/app/api/tournaments/join/route.js
// CHANGED: Paystack transaction/initialize -> Flutterwave /v3/payments
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournament_id } = await req.json();

    if (!tournament_id) {
      return Response.json({ error: "Missing tournament_id" }, { status: 400 });
    }

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

    const existing = await pool.query(
      `SELECT id FROM tournament_contestants 
       WHERE tournament_id = $1 AND user_id = $2`,
      [tournament_id, user.id],
    );
    if (existing.rows.length > 0) {
      return Response.json({ error: "Already registered" }, { status: 409 });
    }

    const tx_ref = `tournament_${tournament_id}_${user.id}_${Date.now()}`;

    // Initialize Flutterwave
    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref,
        // Flutterwave amount is in naira, not kobo.
        amount: nairaAmountCharge,
        currency: "NGN",
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tournament`,
        customer: {
          email: user.email,
        },
        meta: {
          userId: user.id,
          purpose: "tournament",
          tournament_id,
          player_name: user.username,
          player_email: user.email,
        },
      }),
    });

    const flwData = await flwRes.json();

    if (flwData.status !== "success") {
      return Response.json({ error: "Payment init failed" }, { status: 500 });
    }

    return Response.json({
      authorization_url: flwData.data.link,
    });
  } catch (err) {
    console.error("POST /api/tournaments/join error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
