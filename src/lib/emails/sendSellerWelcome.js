import { resend } from "../resend";

const features = [
  "Lower selling fees on every transaction",
  "Top placement in search results",
  "Featured listings on homepage",
  "“Verified Seller” badge (build buyer trust)",
  "Faster payouts",
  "Priority dispute resolution",
  "Advanced sales & performance analytics",
  "Access to high-value buyers",
];

export async function sendSellerWelcomeEmail(duration, email, plan) {
  return resend.emails.send({
    from: "Nepogames <nepo-games@resend.dev>",
    to: email,
    subject: "🎉 Welcome to NepoGames Seller Program",
    html: `
      <div style="font-family: Arial, sans-serif; background:#0f172a; color:#fff; padding:40px;">
        <div style="max-width:600px; margin:auto; background:#020617; border-radius:12px; padding:30px;">
          <div>
              <img src="  https://res.cloudinary.com/dagot597u/image/upload/v1777543140/seller-verified_ufzzzd.png"
                     alt="Gaming Banner"
                     width="100%"
                     style="display:block;border:none;"> 
          </div>
          <h1 style="color:#22c55e; text-align:center;">🎉 Congratulations!</h1>
          
          <p style="font-size:16px; line-height:1.6;">
            Welcome to <strong>NepoGames</strong> — your journey as a verified seller starts now.
          </p>

          <p style="font-size:16px;">
            Your payment was successful and your account has been upgraded.
          </p>

          <div style="background:#020617; border:1px solid #22c55e; padding:20px; border-radius:10px; margin:20px 0;">
            <p style="margin:0; font-size:14px; color:#94a3b8;">Activated Plan</p>
            <h2 style="margin:5px 0; color:#22c55e;">${plan.toUpperCase()} PLAN</h2>
              <p style="margin:0;">Duration: <strong>${duration} month${duration > 1 ? "s" : ""}</strong></p>
            </div>

          <p style="font-size:16px;">
            You can now:
          </p>

          <ul style="line-height:1.8;">
       ${features.map((item, i) => <li key={i}>✔ {item}</li>)}
          </ul>

          <p style="font-size:16px;">
            NepoGames ensures a <strong>safe, secure, and trusted gaming marketplace</strong> for all users.
          </p>

          <div style="text-align:center; margin-top:30px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/marketplace" 
               style="background:#22c55e; color:#000; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
               Go to Marketplace
            </a>
          </div>

          <p style="margin-top:30px; font-size:12px; color:#64748b; text-align:center;">
            © ${new Date().getFullYear()} Nepogames. All rights reserved.
          </p>

        </div>
      </div>
    `,
  });
}
