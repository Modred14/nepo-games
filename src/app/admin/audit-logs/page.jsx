// ROUTE: src/app/admin/audit-logs/page.jsx
//
// DESIGN PASS: rebuilt on AdminShell + the shared design system. No
// edit/delete affordance anywhere on this page, on purpose — the log is
// immutable to normal admins.
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";
import { ScrollText } from "lucide-react";

function formatValue(v) {
  if (v == null) return "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

const TABS = [
  { key: "", label: "All" },
  { key: "transaction", label: "Transactions / Disputes" },
  { key: "withdrawal", label: "Withdrawals" },
  { key: "user", label: "Users" },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceType, setResourceType] = useState("");

  const fetchLogs = useCallback(async (rt) => {
    setLoading(true);
    try {
      const qs = rt ? `?resourceType=${encodeURIComponent(rt)}` : "";
      const res = await fetch(`/api/admin/audit-logs${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load audit log");
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(resourceType);
  }, [resourceType, fetchLogs]);

  return (
    <AdminShell>
      <h1 className="adm-h1">Audit log</h1>
      <p className="adm-sub">
        Every sensitive admin action is recorded here and can't be edited or deleted from
        this dashboard.
      </p>

      <div className="adm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className={`adm-tab ${resourceType === tab.key ? "adm-tab--active" : ""}`}
            onClick={() => setResourceType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Change</th>
              <th>Reason</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <div className="adm-skeleton-row" style={{ border: "none" }} />
                  </td>
                </tr>
              ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="adm-empty">
                    <ScrollText size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No audit log entries yet.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.admin_email || `#${l.admin_id}`}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{l.action}</td>
                  <td>{l.resource_type ? `${l.resource_type} #${l.resource_id}` : "—"}</td>
                  <td style={{ fontSize: 11.5, color: "var(--adm-ink-500)", maxWidth: 260 }}>
                    <div>from: {formatValue(l.previous_value)}</div>
                    <div>to: {formatValue(l.new_value)}</div>
                  </td>
                  <td style={{ color: "var(--adm-ink-500)" }}>{l.reason || "—"}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}