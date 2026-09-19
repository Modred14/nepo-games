// ROUTE: src/app/admin/listings/[id]/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft, Star } from "lucide-react";

function naira(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export default function AdminListingDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load listing");
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

  const moderate = async (moderationStatus) => {
    const labels = { approved: "approve/restore this listing", hidden: "hide this listing from search", rejected: "reject this listing" };
    if (!window.confirm(`Are you sure you want to ${labels[moderationStatus]}?`)) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderationStatus, reason: reason || null }),
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

  const toggleFeature = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !data.listing.featured }),
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

  const toggleDelete = async (restore) => {
    if (!window.confirm(restore ? "Restore this listing?" : "Delete this listing? It will be hidden everywhere, including the seller's own dashboard.")) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore, reason: reason || null }),
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

  const { listing: l, sales } = data;

  return (
    <AdminShell>
      <Link href="/admin/listings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-500)", textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> All listings
      </Link>

      <div className="adm-card" style={{ padding: 22, display: "flex", gap: 20, flexWrap: "wrap" }}>
        {l.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.cover_image} alt={l.title} style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 10, border: "1px solid var(--adm-line)" }} />
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 className="adm-h1" style={{ margin: 0 }}>{l.title}</h1>
            {l.deleted_at && <span className="adm-badge adm-badge--danger">Deleted</span>}
            <span className={`adm-badge ${l.moderation_status === "approved" ? "adm-badge--success" : l.moderation_status === "hidden" ? "adm-badge--warning" : "adm-badge--danger"}`}>
              {l.moderation_status}
            </span>
            {l.featured && <span className="adm-badge adm-badge--blue">Featured</span>}
          </div>
          <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5, margin: 0 }}>
            {naira(l.price)} {l.currency} · {l.platform} · status: {l.status}
          </p>
          <p style={{ color: "var(--adm-ink-400)", fontSize: 12, margin: "6px 0 0" }}>
            Seller: {l.seller_first_name} {l.seller_surname} — {l.seller_email}
          </p>
          {l.moderation_reason && (
            <p style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginTop: 8 }}>
              Last moderation note: {l.moderation_reason} ({l.moderated_by_email})
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 24px" }}>
        {l.moderation_status !== "approved" && (
          <button className="adm-btn adm-btn--success" disabled={busy} onClick={() => moderate("approved")}>Approve / restore</button>
        )}
        {l.moderation_status !== "hidden" && (
          <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => moderate("hidden")}>Hide</button>
        )}
        {l.moderation_status !== "rejected" && (
          <button className="adm-btn adm-btn--danger" disabled={busy} onClick={() => moderate("rejected")}>Reject</button>
        )}
        <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={toggleFeature}>
          <Star size={13} /> {l.featured ? "Unfeature" : "Feature"}
        </button>
        {l.deleted_at ? (
          <button className="adm-btn adm-btn--success" disabled={busy} onClick={() => toggleDelete(true)}>Restore</button>
        ) : (
          <button className="adm-btn adm-btn--danger" disabled={busy} onClick={() => toggleDelete(false)}>Delete listing</button>
        )}
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--adm-ink-500)", margin: "0 0 12px" }}>
        Sales history
      </h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Amount</th><th>Escrow</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {sales.length === 0 && <tr><td colSpan={4}><div className="adm-empty">No sales for this listing yet.</div></td></tr>}
            {sales.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{naira(s.amount)}</td>
                <td><span className="adm-badge adm-badge--neutral">{s.escrow_status}</span></td>
                <td><span className="adm-badge adm-badge--neutral">{s.transaction_status}</span></td>
                <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}