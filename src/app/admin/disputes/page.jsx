// ROUTE: src/app/admin/disputes/page.jsx
//
// DESIGN PASS: now wrapped in AdminShell and using the shared design
// system (adm-* classes from AdminShell.jsx) instead of one-off inline
// styles, for consistency with the rest of the dashboard. Functionality
// (resolve flow, audit-log reason prompt from Phase 1) is unchanged.
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";
import { ShieldAlert } from "lucide-react";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/disputes");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load disputes");
      setDisputes(data.disputes || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const resolve = async (conversationId, resolution) => {
    const confirmMsg =
      resolution === "release_seller"
        ? "Release the frozen funds to the seller?"
        : "Refund the buyer's wallet for this transaction?";

    if (!window.confirm(confirmMsg)) return;

    const reason = window.prompt(
      "Optional: add a reason for this resolution (recorded in the audit log)",
      "",
    );

    setBusyId(conversationId);
    try {
      const res = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, resolution, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to resolve dispute");

      setDisputes((prev) => prev.filter((d) => d.conversation_id !== conversationId));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <h1 className="adm-h1">Disputes</h1>
      <p className="adm-sub">
        Escrow is frozen on each of these until you release funds to the seller or refund
        the buyer.
      </p>

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="adm-skeleton-row" style={{ border: "none" }} />
          ))}
        </div>
      )}

      {!loading && !error && disputes.length === 0 && (
        <div className="adm-card">
          <div className="adm-empty">
            <ShieldAlert size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No open disputes right now.</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {disputes.map((d) => (
          <div key={d.conversation_id} className="adm-card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "var(--adm-ink-900)" }}>
                  {d.game_title}
                </p>
                <p style={{ fontSize: 13, color: "var(--adm-ink-500)", margin: "4px 0 0" }}>
                  ₦{Number(d.amount).toLocaleString()} · Ref: {d.payment_reference} · {d.payment_method}
                </p>
              </div>
              <span className="adm-badge adm-badge--danger">Frozen</span>
            </div>

            <div style={{ display: "flex", gap: 28, marginBottom: 18, fontSize: 13, flexWrap: "wrap" }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--adm-ink-400)",
                    textTransform: "uppercase",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  Buyer
                </p>
                <p style={{ margin: "3px 0 0", color: "var(--adm-ink-900)" }}>
                  {d.buyer_name} — {d.buyer_email}
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--adm-ink-400)",
                    textTransform: "uppercase",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  Seller
                </p>
                <p style={{ margin: "3px 0 0", color: "var(--adm-ink-900)" }}>
                  {d.seller_name} — {d.seller_email}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="adm-btn adm-btn--success"
                onClick={() => resolve(d.conversation_id, "release_seller")}
                disabled={busyId === d.conversation_id}
              >
                Release to seller
              </button>
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => resolve(d.conversation_id, "refund_buyer")}
                disabled={busyId === d.conversation_id}
              >
                Refund buyer
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}