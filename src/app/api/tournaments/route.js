import pool from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";
export async function GET() {
  try {
    const cached = await getCached("tournaments:all");
    if (cached) return Response.json(cached);
    const tournaments = await pool.query(
      `SELECT * FROM tournaments ORDER BY status = 'live' DESC, id ASC`,
    );

    const ids = tournaments.rows.map((t) => t.id);

    const leaderboard = await pool.query(
      `SELECT * FROM tournament_leaderboard WHERE tournament_id = ANY($1) ORDER BY tournament_id, rank ASC`,
      [ids],
    );

    const rules = await pool.query(
      `SELECT * FROM tournament_rules WHERE tournament_id = ANY($1) ORDER BY tournament_id, order_index ASC`,
      [ids],
    );
    const contestants = await pool.query(
      `SELECT tournament_id, email FROM tournament_contestants 
       WHERE tournament_id = ANY($1) AND payment_status = 'confirmed'`,
      [ids],
    );
    // Attach leaderboard + rules to each tournament
    const data = tournaments.rows.map((t) => ({
      ...t,
      prizeRaw: t.prize_raw, // component uses t.prize_raw → t.prizeRaw
      slotsLeft: t.slots_left, // component uses t.slotsLeft
      startDate: t.start_date,
      startTime: t.start_time,
      entryFee: t.entry_fee,
      leaderboard: leaderboard.rows.filter((l) => l.tournament_id === t.id),
      rules: rules.rows
        .filter((r) => r.tournament_id === t.id)
        .map((r) => r.rule),
      contestants: contestants.rows.filter((c) => c.tournament_id === t.id),
    }));
    await setCached("tournaments:all", data, 60);
    return Response.json(data);
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}
