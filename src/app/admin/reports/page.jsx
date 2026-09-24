// ROUTE: src/app/admin/reports/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Flag } from "lucide-react";

const STATUS_BADGE = { open: "adm-badge--warning", reviewed: "adm-badge--success", dismissed: "adm-badge--neutral" };

const TABS = [
  { key: "open", label: "Open" },
  { key: "", label: "All" },
  { key: "reviewed", label: "Reviewed" },
  { key: "dismissed", label: "Dismissed" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchReports = useCallback(async (s) => {
    setLoading(true);
    try {
      const qs = s ? `?status=${encodeURIComponent(s)}` : "";
      const res = await fetch(`/api/admin/reports${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load reports");
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(status);
  }, [status, fetchReports]);

  const quickResolve = async (id, resolveStatus) => {
    if (!window.confirm(`Mark this report as ${resolveStatus}?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolveStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      fetchReports(status);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <h1 className="adm-h1">Reports</h1>
      <p className="adm-sub">
        {total.toLocaleString()} report(s). Filed when a buyer reports a seller from a listing
        page.
      </p>

      <div className="adm-tabs">
        {TABS.map((t) => (
          <button
            key={t.label}
            className={`adm-tab ${status === t.key ? "adm-tab--active" : ""}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Reported user</th><th>Reason</th><th>Listing</th><th>Reporter</th><th>Status</th><th>Filed</th><th></th></tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">
                    <Flag size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No reports in this view.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.reported_user_email}</div>
                    {r.messaging_restricted && <span className="adm-badge adm-badge--danger">Messaging restricted</span>}
                  </td>
                  <td style={{ maxWidth: 220, fontSize: 12.5 }}>{r.reason}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12.5 }}>{r.listing_title || "—"}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12.5 }}>{r.reporter_email}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Link href={`/admin/reports/${r.id}`} className="adm-btn adm-btn--ghost">Investigate</Link>
                      {r.status === "open" && (
                        <button className="adm-btn adm-btn--ghost" disabled={busyId === r.id} onClick={() => quickResolve(r.id, "dismissed")}>
                          Dismiss
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}