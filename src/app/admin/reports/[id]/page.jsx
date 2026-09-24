// ROUTE: src/app/admin/reports/[id]/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft } from "lucide-react";

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load report");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolve = async (status) => {
    const restrictUser =
      status === "reviewed" &&
      window.confirm("Also restrict this user from sending new messages?");

    if (!window.confirm(`Mark this report as ${status}?`)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, restrictUser }),
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

  const { report: r, conversations } = data;

  return (
    <AdminShell>
      <Link href="/admin/reports" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-500)", textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> All reports
      </Link>

      <div className="adm-card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="adm-h1" style={{ margin: 0 }}>Report against {r.reported_user_email}</h1>
            <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5, margin: "6px 0 0" }}>
              Filed by {r.reporter_email} · {r.listing_title || "no listing"}
            </p>
          </div>
          <span className={`adm-badge ${r.status === "open" ? "adm-badge--warning" : r.status === "reviewed" ? "adm-badge--success" : "adm-badge--neutral"}`}>
            {r.status}
          </span>
        </div>
        <p style={{ marginTop: 16, fontSize: 13.5 }}>{r.reason}</p>
        {r.messaging_restricted && (
          <div className="adm-badge adm-badge--danger" style={{ marginTop: 12 }}>This user's messaging is currently restricted</div>
        )}

        {r.status === "open" && (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button className="adm-btn adm-btn--success" disabled={busy} onClick={() => resolve("reviewed")}>
              Mark reviewed
            </button>
            <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => resolve("dismissed")}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-ink-500)", margin: "0 0 12px" }}>
        {r.reported_user_email}'s recent conversations
      </h2>
      <p style={{ fontSize: 12, color: "var(--adm-ink-400)", marginBottom: 12 }}>
        Opening a conversation to read its messages is recorded in the audit log.
      </p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>With</th><th>Listing</th><th>Messages</th><th>Last activity</th><th></th></tr></thead>
          <tbody>
            {conversations.length === 0 && <tr><td colSpan={5}><div className="adm-empty">No conversations found.</div></td></tr>}
            {conversations.map((c) => (
              <tr key={c.id}>
                <td>{c.other_participant_email}</td>
                <td style={{ color: "var(--adm-ink-500)" }}>{c.listing_title || "—"}</td>
                <td>{c.message_count}</td>
                <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "—"}
                </td>
                <td><Link href={`/admin/conversations/${c.id}`} className="adm-btn adm-btn--ghost">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}