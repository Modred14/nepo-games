// ROUTE: src/app/api/admin/email-templates/route.js  (NEW)
//
// ADMIN DASHBOARD: read-only. Serves the static catalog in
// src/app/admin/_data/emailTemplates.js — see that file's header for why
// this is a hand-curated snapshot rather than a live file reader, and
// which entries are verbatim vs. metadata-only. This route does not
// read, write, or import any of the actual email-sending route files —
// zero risk to any live send path, by construction.
import { requireAdmin } from "@/lib/auth";
import { EMAIL_TEMPLATES } from "@/app/admin/_data/emailTemplates";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ templates: EMAIL_TEMPLATES });
}