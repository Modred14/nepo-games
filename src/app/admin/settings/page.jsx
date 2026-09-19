// ROUTE: src/app/admin/settings/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [draft, setDraft] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load settings");
      setSettings(data.settings);
      setDraft(data.settings);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = async (key) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: draft[key] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      fetchSettings();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading && !settings) {
    return <AdminShell><div className="adm-skeleton-row" style={{ height: 300, borderRadius: 16, border: "none" }} /></AdminShell>;
  }
  if (error) {
    return <AdminShell><div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)" }}>{error}</div></AdminShell>;
  }
  if (!settings) return null;

  return (
    <AdminShell>
      <h1 className="adm-h1">Settings</h1>
      <p className="adm-sub">
        Business rules that were previously hardcoded in the codebase. Changing a value here
        takes effect on the next request — no deploy needed.
      </p>

      <SettingRow
        label="Seller fee"
        hint="Percentage of the sale price taken as the platform fee on every marketplace purchase."
        suffix="%"
        value={draft.seller_fee_percent}
        onChange={(v) => setDraft((d) => ({ ...d, seller_fee_percent: v }))}
        onSave={() => save("seller_fee_percent")}
        saving={saving === "seller_fee_percent"}
      />

      <SettingRow
        label="Escrow confirmation window"
        hint="How long a buyer has to confirm login details before escrow auto-releases to the seller."
        suffix="minutes"
        value={draft.escrow_window_minutes}
        onChange={(v) => setDraft((d) => ({ ...d, escrow_window_minutes: v }))}
        onSave={() => save("escrow_window_minutes")}
        saving={saving === "escrow_window_minutes"}
      />

      <SettingRow
        label="Minimum withdrawal"
        hint="Smallest amount a user can withdraw in one request."
        prefix="₦"
        value={draft.minimum_withdrawal_naira}
        onChange={(v) => setDraft((d) => ({ ...d, minimum_withdrawal_naira: v }))}
        onSave={() => save("minimum_withdrawal_naira")}
        saving={saving === "minimum_withdrawal_naira"}
      />

      <div className="adm-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Withdrawal fee tiers</div>
        <div style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginBottom: 16 }}>
          Flat fee charged to the user, based on the withdrawal amount. Set above Flutterwave's own
          transfer cost (₦10.75 / ₦26.88 / ₦53.75 incl. VAT as of the last check) so the platform
          keeps a margin.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
          <TierField label="Up to ₦" value={draft.withdrawal_fee_tiers?.tier1_max} onChange={(v) => setDraft((d) => ({ ...d, withdrawal_fee_tiers: { ...d.withdrawal_fee_tiers, tier1_max: v } }))} />
          <TierField label="Fee for tier 1" value={draft.withdrawal_fee_tiers?.tier1_fee} onChange={(v) => setDraft((d) => ({ ...d, withdrawal_fee_tiers: { ...d.withdrawal_fee_tiers, tier1_fee: v } }))} />
          <TierField label="Up to ₦ (tier 2)" value={draft.withdrawal_fee_tiers?.tier2_max} onChange={(v) => setDraft((d) => ({ ...d, withdrawal_fee_tiers: { ...d.withdrawal_fee_tiers, tier2_max: v } }))} />
          <TierField label="Fee for tier 2" value={draft.withdrawal_fee_tiers?.tier2_fee} onChange={(v) => setDraft((d) => ({ ...d, withdrawal_fee_tiers: { ...d.withdrawal_fee_tiers, tier2_fee: v } }))} />
          <TierField label="Fee above tier 2" value={draft.withdrawal_fee_tiers?.tier3_fee} onChange={(v) => setDraft((d) => ({ ...d, withdrawal_fee_tiers: { ...d.withdrawal_fee_tiers, tier3_fee: v } }))} />
        </div>
        <button className="adm-btn adm-btn--primary" disabled={saving === "withdrawal_fee_tiers"} onClick={() => save("withdrawal_fee_tiers")}>
          {saving === "withdrawal_fee_tiers" ? "Saving..." : "Save tiers"}
        </button>
      </div>
    </AdminShell>
  );
}

function SettingRow({ label, hint, prefix, suffix, value, onChange, onSave, saving }) {
  return (
    <div className="adm-card" style={{ padding: 20, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ maxWidth: 460 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginTop: 2 }}>{hint}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {prefix && <span style={{ color: "var(--adm-ink-500)", fontSize: 13 }}>{prefix}</span>}
        <input
          className="adm-input"
          style={{ width: 100 }}
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span style={{ color: "var(--adm-ink-500)", fontSize: 13 }}>{suffix}</span>}
        <button className="adm-btn adm-btn--primary" disabled={saving} onClick={onSave}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function TierField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, color: "var(--adm-ink-500)", display: "block", marginBottom: 4 }}>{label}</label>
      <input className="adm-input" type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}