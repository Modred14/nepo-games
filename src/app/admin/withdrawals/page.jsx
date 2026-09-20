// ROUTE: src/app/admin/withdrawals/page.jsx
//
// DESIGN PASS: rebuilt on AdminShell + the shared design system.
// Functionality unchanged: status tabs, per-row Recheck (status-only,
// never creates a new transfer — see the recheck route's comments),
// fee/net columns from the withdrawal-fee feature.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "../_components/AdminShell";
import { Banknote } from "lucide-react";

const STATUS_BADGE = {
  success: "adm-badge--success",
  pending: "adm-badge--warning",
  unknown: "adm-badge--danger",
  failed: "adm-badge--neutral",
};

const TABS = [
  { key: null, label: "All" },
  { key: "unknown", label: "Unknown" },
  { key: "pending", label: "Pending" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
];

function naira(n) {
  return `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [counts, setCounts] = useState({});
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState(
    ["pending", "unknown", "success", "failed"].includes(initialStatus) ? initialStatus : null,
  );
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
      const res = await fetch(`/api/admin/withdrawals/${id}/recheck`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Recheck failed");

      setLastResult(
        `#${id}: ${data.previousStatus} → ${data.newStatus} (Flutterwave: ${data.flutterwaveStatus})`,
      );
      fetchWithdrawals(statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <h1 className="adm-h1">Withdrawals</h1>
      <p className="adm-sub">
        'Unknown' rows couldn't be confirmed against Flutterwave automatically — recheck
        pulls the live status without creating a new transfer.
      </p>

      <div className="adm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className={`adm-tab ${statusFilter === tab.key ? "adm-tab--active" : ""}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            {tab.key && counts[tab.key] ? ` (${counts[tab.key]})` : ""}
          </button>
        ))}
      </div>

      {lastResult && (
        <div
          className="adm-card"
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--adm-success)",
            borderColor: "var(--adm-success-line)",
            background: "var(--adm-success-bg)",
          }}
        >
          {lastResult}
        </div>
      )}

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>User</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Sent to bank</th>
              <th>Bank</th>
              <th>Reference</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}>
                    <div className="adm-skeleton-row" style={{ border: "none" }} />
                  </td>
                </tr>
              ))}
            {!loading && withdrawals.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="adm-empty">
                    <Banknote size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No withdrawals in this view.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span className={`adm-badge ${STATUS_BADGE[w.status] || "adm-badge--neutral"}`}>
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.user_name || "—"}</div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{w.user_email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{naira(w.amount)}</td>
                  <td style={{ color: "var(--adm-ink-500)" }}>
                    {w.fee_amount != null ? naira(w.fee_amount) : "—"}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {w.fee_amount != null ? naira(Number(w.amount) - Number(w.fee_amount)) : "—"}
                  </td>
                  <td>
                    <div>{w.bank_name || "—"}</div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                      {w.account_number} · {w.account_name}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{w.reference}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                    {new Date(w.created_at).toLocaleString()}
                  </td>
                  <td>
                    {(w.status === "pending" || w.status === "unknown") && (
                      <button
                        className="adm-btn adm-btn--ghost"
                        disabled={busyId === w.id}
                        onClick={() => recheck(w.id)}
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
    </AdminShell>
  );
}