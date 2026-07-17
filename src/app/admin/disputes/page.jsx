// src/app/admin/disputes/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";

// FIX (critical): this page is the missing piece that made the dispute
// system actually usable — previously a dispute could be raised and
// escrow frozen, but there was no UI (and no API) to resolve it, so money
// sat stuck until someone manually edited the database. This lists every
// open dispute and lets support release funds to the seller or refund the
// buyer, via /api/admin/disputes and /api/admin/disputes/resolve.
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

    setBusyId(conversationId);
    try {
      const res = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, resolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to resolve dispute");

      setDisputes((prev) =>
        prev.filter((d) => d.conversation_id !== conversationId),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Open disputes</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Escrow is frozen on each of these until you release funds to the seller or refund the buyer.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && disputes.length === 0 && (
        <p style={{ color: "#666" }}>No open disputes right now.</p>
      )}

      {disputes.map((d) => (
        <div
          key={d.conversation_id}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{d.game_title}</p>
              <p style={{ fontSize: 13, color: "#666", margin: "2px 0 0" }}>
                ₦{Number(d.amount).toLocaleString()} · Ref: {d.payment_reference} · {d.payment_method}
              </p>
            </div>
            <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>FROZEN</span>
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 16, fontSize: 13 }}>
            <div>
              <p style={{ margin: 0, color: "#999", textTransform: "uppercase", fontSize: 11 }}>Buyer</p>
              <p style={{ margin: "2px 0 0" }}>{d.buyer_name} — {d.buyer_email}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#999", textTransform: "uppercase", fontSize: 11 }}>Seller</p>
              <p style={{ margin: "2px 0 0" }}>{d.seller_name} — {d.seller_email}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => resolve(d.conversation_id, "release_seller")}
              disabled={busyId === d.conversation_id}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "#16a34a",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                opacity: busyId === d.conversation_id ? 0.6 : 1,
              }}
            >
              Release to seller
            </button>
            <button
              onClick={() => resolve(d.conversation_id, "refund_buyer")}
              disabled={busyId === d.conversation_id}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#111",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                opacity: busyId === d.conversation_id ? 0.6 : 1,
              }}
            >
              Refund buyer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}