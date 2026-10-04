// ROUTE: src/app/api/admin/settings/route.js
//
// ADMIN DASHBOARD PHASE 4: read/write platform_settings. See
// src/lib/settings.js for the fail-open-to-defaults behavior and the
// full list of what's wired up: seller fee %, escrow window, minimum
// withdrawal, withdrawal fee tiers.
import { requireAdmin } from "@/lib/auth";
import { getAllSettings, setSetting, SETTING_DEFAULTS, isValidSetting, coerceSetting } from "@/lib/settings";
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

    const body = await req.json().catch(() => ({}));
    const { key, reason } = body;

    if (typeof key !== "string" || !Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
      return Response.json({ error: "Unknown setting" }, { status: 400 });
    }
    const value = coerceSetting(key, body.value);
    if (!isValidSetting(key, value)) {
      return Response.json({ error: `Invalid value for ${key}` }, { status: 400 });
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
    console.error("ADMIN SETTINGS UPDATE ERROR:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}