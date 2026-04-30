import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "No reference" }, { status: 400 });
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const data = await verifyRes.json();

  if (!data.status || data.data.status !== "success") {
    return NextResponse.json(
      { error: "Payment not successful" },
      { status: 400 },
    );
  }

  const plan = data.data.metadata.plan;
 const userId = session.user.id;

  await pool.query(
    `UPDATE users
     SET plan = $1,
         subscription_status = 'active',
         subscription_start = NOW(),
         subscription_end = NOW() + interval '1 month'
     WHERE id = $2`,
    [plan, userId],
  );

  return NextResponse.json({ success: true });
}
