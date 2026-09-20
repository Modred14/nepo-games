// ROUTE: src/app/admin/subscriptions/[userId]/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft } from "lucide-react";

const PRESETS = [
  { label: "Grant Pro — 30 days", days: 30 },
  { label: "Grant Plus — 90 days", days: 90 },
  { label: "Grant Premium — 365 days", days: 365 },
];

function naira(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export default function AdminSubscriptionDetailPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [customDays, setCustomDays] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load subscriber");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const extend = async (days) => {
    if (!window.confirm(`Grant ${days > 0 ? "+" : ""}${days} days to this subscription?`)) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, reason: reason || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this subscription immediately? The user will drop to Free right away.")) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${userId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return <AdminShell><div className="adm-skeleton-row" style={{ height: 120, borderRadius: 16, border: "none" }} /></AdminShell>;
  }
  if (error) {
    return <AdminShell><div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)" }}>{error}</div></AdminShell>;
  }
  if (!data) return null;

  const { user: u, payments } = data;

  return (
    <AdminShell>
      <Link href="/admin/subscriptions" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-500)", textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> All subscribers
      </Link>

      <div className="adm-card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="adm-h1" style={{ margin: 0 }}>{u.first_name} {u.surname}</h1>
            <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5, margin: "6px 0 0" }}>{u.email} · @{u.username}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="adm-badge adm-badge--blue" style={{ textTransform: "capitalize" }}>{u.plan}</span>
            <span className={`adm-badge ${u.subscription_status === "active" ? "adm-badge--success" : "adm-badge--neutral"}`}>{u.subscription_status}</span>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginTop: 14 }}>
          Started {u.subscription_start ? new Date(u.subscription_start).toLocaleDateString() : "—"} · Expires{" "}
          {u.subscription_end ? new Date(u.subscription_end).toLocaleDateString() : "—"}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
          {PRESETS.map((p) => (
            <button key={p.days} className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => extend(p.days)}>
              {p.label}
            </button>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="adm-input"
              style={{ width: 90 }}
              type="number"
              placeholder="days"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
            <button
              className="adm-btn adm-btn--primary"
              disabled={busy || !customDays}
              onClick={() => extend(Number(customDays))}
            >
              Apply
            </button>
          </div>
          {u.plan !== "free" && (
            <button className="adm-btn adm-btn--danger" disabled={busy} onClick={cancel}>
              Cancel subscription
            </button>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-ink-500)", margin: "0 0 12px" }}>
        Payment history
      </h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Amount</th><th>Reference</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={4}><div className="adm-empty">No subscription payments yet.</div></td></tr>}
            {payments.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{naira(p.amount)}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.reference}</td>
                <td><span className={`adm-badge ${p.status === "success" ? "adm-badge--success" : "adm-badge--neutral"}`}>{p.status}</span></td>
                <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}