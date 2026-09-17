// ROUTE: src/app/admin/audit-logs/page.jsx  (NEW)
//
// ADMIN DASHBOARD PHASE 1: read-only feed of admin_audit_log entries.
// Deliberately no edit/delete affordance anywhere on this page — the log
// is meant to be immutable to normal admins (Section 16 of the spec).
"use client";

import { useState, useEffect, useCallback } from "react";

function formatValue(v) {
  if (v == null) return "—";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

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
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Audit log</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
        Every sensitive admin action — dispute resolutions, withdrawal rechecks, and
        anything added in later phases — is recorded here and can't be edited or deleted
        from this dashboard.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "", label: "All" },
          { key: "transaction", label: "Transactions/Disputes" },
          { key: "withdrawal", label: "Withdrawals" },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setResourceType(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #e5e5e5",
              background: resourceType === tab.key ? "#111" : "#fff",
              color: resourceType === tab.key ? "#fff" : "#333",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p style={{ color: "#666" }}>No audit log entries yet.</p>
      )}

      {!loading && !error && logs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e5e5" }}>
                <th style={{ padding: "8px 6px" }}>Admin</th>
                <th style={{ padding: "8px 6px" }}>Action</th>
                <th style={{ padding: "8px 6px" }}>Resource</th>
                <th style={{ padding: "8px 6px" }}>Change</th>
                <th style={{ padding: "8px 6px" }}>Reason</th>
                <th style={{ padding: "8px 6px" }}>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 6px" }}>{l.admin_email || `#${l.admin_id}`}</td>
                  <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>
                    {l.action}
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    {l.resource_type ? `${l.resource_type} #${l.resource_id}` : "—"}
                  </td>
                  <td style={{ padding: "8px 6px", fontSize: 11, color: "#666", maxWidth: 260 }}>
                    <div>from: {formatValue(l.previous_value)}</div>
                    <div>to: {formatValue(l.new_value)}</div>
                  </td>
                  <td style={{ padding: "8px 6px", color: "#666" }}>{l.reason || "—"}</td>
                  <td style={{ padding: "8px 6px", color: "#888", fontSize: 12 }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}