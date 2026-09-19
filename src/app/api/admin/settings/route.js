// ROUTE: src/app/api/admin/settings/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 4: read/write platform_settings. See
// src/lib/settings.js for the fail-open-to-defaults behavior and the
// full list of what's wired up: seller fee %, escrow window, minimum
// withdrawal, withdrawal fee tiers.
import { requireAdmin } from "@/lib/auth";
import { getAllSettings, setSetting, SETTING_DEFAULTS } from "@/lib/settings";
import { logAdminAction } from "@/lib/adminAudit";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getAllSettings();
    return Response.json({ settings });
  } catch (err) {
    console.error("ADMIN SETTINGS GET ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value, reason } = await req.json();

    if (!(key in SETTING_DEFAULTS)) {
      return Response.json({ error: `Unknown setting: ${key}` }, { status: 400 });
    }

    const before = await getAllSettings();
    await setSetting(key, value, admin.id);

    logAdminAction({
      admin,
      action: "settings.update",
      resourceType: "setting",
      resourceId: key,
      previousValue: { [key]: before[key] },
      newValue: { [key]: value },
      reason: reason || null,
      req,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("ADMIN SETTINGS UPDATE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}