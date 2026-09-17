// ROUTE: src/app/admin/withdrawals/page.jsx  (NEW)
//
// Admin visibility into withdrawals — didn't exist before this. Built to
// close the gap the original audit flagged: withdrawals ran fully
// automatically with no way to see pending/unknown/failed rows short of
// querying the database directly. Mirrors the existing style of
// src/app/admin/disputes/page.jsx (plain fetch + inline styles, no
// component library) for consistency.
"use client";

import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS = {
  success: "#16a34a",
  pending: "#ca8a04",
  unknown: "#dc2626",
  failed: "#6b7280",
};

const TABS = [
  { key: null, label: "All" },
  { key: "unknown", label: "Unknown ⚠️" },
  { key: "pending", label: "Pending" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
];

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const fetchWithdrawals = useCallback(async (status) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/admin/withdrawals${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load withdrawals");
      setWithdrawals(data.withdrawals || []);
      setCounts(data.counts || {});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals(statusFilter);
  }, [statusFilter, fetchWithdrawals]);

  const recheck = async (id) => {
    setBusyId(id);
    setLastResult(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/recheck`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Recheck failed");

      setLastResult(
        `#${id}: ${data.previousStatus} → ${data.newStatus} (Flutterwave says: ${data.flutterwaveStatus})`,
      );
      fetchWithdrawals(statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Withdrawals</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
        'Unknown' rows couldn't be confirmed against Flutterwave automatically after a
        network error — hit Recheck to try again, or wait for the next automatic sweep.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #e5e5e5",
              background: statusFilter === tab.key ? "#111" : "#fff",
              color: statusFilter === tab.key ? "#fff" : "#333",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
            {tab.key && counts[tab.key] ? ` (${counts[tab.key]})` : ""}
          </button>
        ))}
      </div>

      {lastResult && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#166534",
          }}
        >
          {lastResult}
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && withdrawals.length === 0 && (
        <p style={{ color: "#666" }}>No withdrawals in this view.</p>
      )}

      {!loading && !error && withdrawals.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e5e5" }}>
                <th style={{ padding: "8px 6px" }}>Status</th>
                <th style={{ padding: "8px 6px" }}>User</th>
                <th style={{ padding: "8px 6px" }}>Amount</th>
                <th style={{ padding: "8px 6px" }}>Fee</th>
                <th style={{ padding: "8px 6px" }}>Sent to bank</th>
                <th style={{ padding: "8px 6px" }}>Bank</th>
                <th style={{ padding: "8px 6px" }}>Reference</th>
                <th style={{ padding: "8px 6px" }}>Created</th>
                <th style={{ padding: "8px 6px" }}></th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 6px" }}>
                    <span
                      style={{
                        color: STATUS_COLORS[w.status] || "#333",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: 11,
                      }}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <div>{w.user_name || "—"}</div>
                    <div style={{ color: "#888", fontSize: 12 }}>{w.user_email}</div>
                  </td>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>
                    ₦{formatMoney(w.amount)}
                  </td>
                  <td style={{ padding: "8px 6px", color: "#888" }}>
                    {w.fee_amount != null ? `₦${formatMoney(w.fee_amount)}` : "—"}
                  </td>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>
                    {w.fee_amount != null
                      ? `₦${formatMoney(Number(w.amount) - Number(w.fee_amount))}`
                      : "—"}
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <div>{w.bank_name || "—"}</div>
                    <div style={{ color: "#888", fontSize: 12 }}>
                      {w.account_number} · {w.account_name}
                    </div>
                  </td>
                  <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>
                    {w.reference}
                  </td>
                  <td style={{ padding: "8px 6px", color: "#888", fontSize: 12 }}>
                    {new Date(w.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    {(w.status === "pending" || w.status === "unknown") && (
                      <button
                        onClick={() => recheck(w.id)}
                        disabled={busyId === w.id}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "#fff",
                          fontSize: 12,
                          cursor: busyId === w.id ? "default" : "pointer",
                          opacity: busyId === w.id ? 0.6 : 1,
                        }}
                      >
                        {busyId === w.id ? "Checking..." : "Recheck"}
                      </button>
                    )}
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