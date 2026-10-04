// ROUTE: src/app/api/tournaments/route.js
import pool from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";
import { requireUser } from "@/lib/auth";
export async function GET() {
  try {
    // PRIVACY: this public endpoint used to return the e-mail address of every
    // paid contestant. The cached payload now contains NO personal data; only
    // the caller's own registration status is added per request.
    let data = await getCached("tournaments:public:v2");
    if (!data) {
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
      `SELECT tournament_id, user_id FROM tournament_contestants 
       WHERE tournament_id = ANY($1) AND payment_status = 'confirmed'`,
      [ids],
    );
    // Attach leaderboard + rules to each tournament
    data = tournaments.rows.map((t) => ({
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
      contestantCount: contestants.rows.filter((c) => c.tournament_id === t.id).length,
      _registeredUserIds: contestants.rows
        .filter((c) => c.tournament_id === t.id)
        .map((c) => c.user_id),
    }));
    await setCached("tournaments:public:v2", data, 60);
    }

    const me = await requireUser();
    const out = data.map(({ _registeredUserIds, ...t }) => ({
      ...t,
      alreadyRegistered: !!me && _registeredUserIds.some((id) => Number(id) === Number(me.id)),
    }));

    return Response.json(out);
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}
