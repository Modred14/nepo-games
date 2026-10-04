// ROUTE: src/lib/resend.js
import { Resend } from "resend";

// The Resend constructor throws when no key is given, which broke
// `next build` in any environment without runtime secrets (CI, Docker build
// stage). A placeholder lets the build complete; real sends fail with a clear
// auth error from Resend if RESEND_API_KEY is genuinely missing at runtime.
if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === "production") {
  console.warn("RESEND_API_KEY is not set — emails will fail to send.");
}
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");
