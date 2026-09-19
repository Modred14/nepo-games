// ROUTE: src/app/admin/transactions/[id]/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft } from "lucide-react";

function naira(n) {
  return `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const HELD_STATUSES = ["held", "holding", "frozen"];

export default function AdminTransactionDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load transaction");
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

  const doAction = async (path, body, confirmMsg, requireReason) => {
    if (!window.confirm(confirmMsg)) return;
    let reason = null;
    if (requireReason) {
      reason = window.prompt("A reason is required for this action:", "");
      if (!reason || !reason.trim()) {
        alert("A reason is required.");
        return;
      }
    } else {
      reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/transactions/${id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, reason }),
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
    return (
      <AdminShell>
        <div className="adm-skeleton-row" style={{ height: 120, borderRadius: 16, border: "none" }} />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)" }}>{error}</div>
      </AdminShell>
    );
  }

  if (!data) return null;
  const { transaction: t, ledger, timeline } = data;
  const isHeld = HELD_STATUSES.includes(t.escrow_status);
  const isCancellable = ["initiated", "pending"].includes(t.transaction_status);

  return (
    <AdminShell>
      <Link
        href="/admin/transactions"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-500)", textDecoration: "none", marginBottom: 14 }}
      >
        <ArrowLeft size={14} /> All transactions
      </Link>

      <div className="adm-card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="adm-h1" style={{ margin: 0 }}>{t.listing_title || `Transaction #${t.id}`}</h1>
            <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5, margin: "6px 0 0" }}>
              {naira(t.amount)} · {t.payment_method} · Ref: {t.payment_reference || "—"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="adm-badge adm-badge--neutral">{t.transaction_status}</span>
            <span className={`adm-badge ${isHeld ? "adm-badge--warning" : "adm-badge--success"}`}>
              escrow: {t.escrow_status}
            </span>
            {t.flagged_for_review && <span className="adm-badge adm-badge--warning">Flagged</span>}
            {t.frozen && <span className="adm-badge adm-badge--danger">Frozen</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, marginTop: 18, fontSize: 13, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "var(--adm-ink-400)", textTransform: "uppercase", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em" }}>Buyer</p>
            <p style={{ margin: "3px 0 0" }}>{t.buyer_first_name} {t.buyer_surname} — {t.buyer_email}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: "var(--adm-ink-400)", textTransform: "uppercase", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em" }}>Seller</p>
            <p style={{ margin: "3px 0 0" }}>{t.seller_first_name} {t.seller_surname} — {t.seller_email}</p>
          </div>
        </div>

        {(t.flagged_reason || t.frozen_reason) && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--adm-ink-500)" }}>
            {t.flagged_reason && <p style={{ margin: "2px 0" }}>Flag reason: {t.flagged_reason} ({t.flagged_by_email})</p>}
            {t.frozen_reason && <p style={{ margin: "2px 0" }}>Freeze reason: {t.frozen_reason} ({t.frozen_by_email})</p>}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
          <button
            className="adm-btn adm-btn--ghost"
            disabled={busy}
            onClick={() =>
              doAction("flag", { flagged: !t.flagged_for_review }, t.flagged_for_review ? "Unflag this transaction?" : "Flag this transaction for review?", false)
            }
          >
            {t.flagged_for_review ? "Unflag" : "Flag for review"}
          </button>

          {isHeld && (
            <button
              className="adm-btn adm-btn--ghost"
              disabled={busy}
              onClick={() =>
                doAction("freeze", { frozen: !t.frozen }, t.frozen ? "Unfreeze this transaction? Auto-release and buyer confirm will work again." : "Freeze this transaction? It will be blocked from auto-release and buyer confirm until unfrozen.", false)
              }
            >
              {t.frozen ? "Unfreeze" : "Freeze"}
            </button>
          )}

          {isHeld && (
            <>
              <button
                className="adm-btn adm-btn--success"
                disabled={busy}
                onClick={() =>
                  doAction("resolve", { resolution: "release_seller" }, "Release this transaction's escrow to the seller?", true)
                }
              >
                Release to seller
              </button>
              <button
                className="adm-btn adm-btn--danger"
                disabled={busy}
                onClick={() =>
                  doAction("resolve", { resolution: "refund_buyer" }, "Refund this transaction's escrow to the buyer's wallet?", true)
                }
              >
                Refund buyer
              </button>
            </>
          )}

          {isCancellable && (
            <button
              className="adm-btn adm-btn--danger"
              disabled={busy}
              onClick={() => doAction("cancel", {}, "Cancel this stuck/abandoned transaction? No money has moved yet.", false)}
            >
              Cancel transaction
            </button>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-ink-500)", margin: "0 0 12px" }}>
        Timeline
      </h2>
      <div className="adm-card" style={{ padding: 20, marginBottom: 24 }}>
        {timeline.length === 0 && <div className="adm-empty">No timeline events recorded.</div>}
        {timeline.map((ev, i) => (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: i < timeline.length - 1 ? "1px solid var(--adm-line-soft)" : "none" }}>
            <div style={{ minWidth: 150, fontSize: 12, color: "var(--adm-ink-400)" }}>
              {ev.at ? new Date(ev.at).toLocaleString() : "—"}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.label}</div>
              {ev.detail && <div style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginTop: 2 }}>{ev.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-ink-500)", margin: "0 0 12px" }}>
        Ledger entries
      </h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 && (
              <tr><td colSpan={6}><div className="adm-empty">No ledger entries found for this reference.</div></td></tr>
            )}
            {ledger.map((l) => (
              <tr key={l.id}>
                <td>{l.description}</td>
                <td style={{ color: "var(--adm-ink-500)" }}>#{l.user_id}</td>
                <td>{l.type === "credit" ? "+ Credit" : "– Debit"}</td>
                <td style={{ fontWeight: 600 }}>{naira(l.amount)}</td>
                <td>
                  <span className={`adm-badge ${l.status === "success" ? "adm-badge--success" : l.status === "failed" ? "adm-badge--danger" : "adm-badge--warning"}`}>
                    {l.status}
                  </span>
                </td>
                <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}