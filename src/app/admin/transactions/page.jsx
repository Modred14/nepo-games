// ROUTE: src/app/admin/transactions/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Search, Receipt } from "lucide-react";

const STATUS_BADGE = {
  completed: "adm-badge--success",
  pending: "adm-badge--warning",
  initiated: "adm-badge--warning",
  failed: "adm-badge--danger",
  disputed: "adm-badge--danger",
  refunded: "adm-badge--neutral",
  cancelled: "adm-badge--neutral",
};

function naira(n) {
  return `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminTransactionsPage() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  // Read initial state from the URL so links from the notification
  // center (?flagged=true or ?frozen=true) actually land pre-filtered,
  // instead of silently opening on the unfiltered "All" view.
  const [flaggedOnly, setFlaggedOnly] = useState(searchParams.get("flagged") === "true");
  const [frozenOnly, setFrozenOnly] = useState(searchParams.get("frozen") === "true");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchTx = useCallback(async (s, st, flagged, frozen, p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(pageSize), offset: String(p * pageSize) });
      if (s) qs.set("search", s);
      if (st) qs.set("status", st);
      if (flagged) qs.set("flagged", "true");
      if (frozen) qs.set("frozen", "true");

      const res = await fetch(`/api/admin/transactions?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load transactions");
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchTx(search, status, flaggedOnly, frozenOnly, page), 250);
    return () => clearTimeout(t);
  }, [search, status, flaggedOnly, frozenOnly, page, fetchTx]);

  useEffect(() => setPage(0), [search, status, flaggedOnly, frozenOnly]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <h1 className="adm-h1">Transactions</h1>
      <p className="adm-sub">{total.toLocaleString()} total transactions across the marketplace.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <Search size={15} color="var(--adm-ink-400)" style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            className="adm-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by buyer/seller email or listing"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="adm-select" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="initiated">Initiated</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-700)" }}>
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged for review only
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-700)" }}>
          <input type="checkbox" checked={frozenOnly} onChange={(e) => setFrozenOnly(e.target.checked)} />
          Frozen only
        </label>
      </div>

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Amount</th>
              <th>Escrow</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}><div className="adm-skeleton-row" style={{ border: "none" }} /></td>
                </tr>
              ))}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="adm-empty">
                    <Receipt size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No transactions match this search/filter.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.listing_title || "—"}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12.5 }}>{t.buyer_email}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12.5 }}>{t.seller_email}</td>
                  <td style={{ fontWeight: 600 }}>{naira(t.amount)}</td>
                  <td>
                    <span className={`adm-badge ${["held", "holding", "frozen"].includes(t.escrow_status) ? "adm-badge--warning" : t.escrow_status === "released" ? "adm-badge--success" : "adm-badge--neutral"}`}>
                      {t.escrow_status}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${STATUS_BADGE[t.disputed ? "disputed" : t.transaction_status] || "adm-badge--neutral"}`}>
                      {t.disputed ? "disputed" : t.transaction_status}
                    </span>
                  </td>
                  <td>
                    {t.flagged_for_review && <span className="adm-badge adm-badge--warning">Flagged</span>}{" "}
                    {t.frozen && <span className="adm-badge adm-badge--danger">Frozen</span>}
                  </td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/transactions/${t.id}`} className="adm-btn adm-btn--ghost">
                      Investigate
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button className="adm-btn adm-btn--ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span style={{ fontSize: 12.5, color: "var(--adm-ink-500)" }}>Page {page + 1} of {totalPages}</span>
          <button className="adm-btn adm-btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </AdminShell>
  );
}