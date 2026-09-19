// ROUTE: src/app/admin/listings/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Search, Gamepad2, Star } from "lucide-react";

const MOD_BADGE = { approved: "adm-badge--success", hidden: "adm-badge--warning", rejected: "adm-badge--danger" };

function naira(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchListings = useCallback(async (s, m, p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(pageSize), offset: String(p * pageSize) });
      if (s) qs.set("search", s);
      if (m) qs.set("moderationStatus", m);
      const res = await fetch(`/api/admin/listings?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load listings");
      setListings(data.listings || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchListings(search, moderationStatus, page), 250);
    return () => clearTimeout(t);
  }, [search, moderationStatus, page, fetchListings]);

  useEffect(() => setPage(0), [search, moderationStatus]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <h1 className="adm-h1">Listings</h1>
      <p className="adm-sub">{total.toLocaleString()} listings.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <Search size={15} color="var(--adm-ink-400)" style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            className="adm-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by title or seller email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="adm-select" style={{ maxWidth: 180 }} value={moderationStatus} onChange={(e) => setModerationStatus(e.target.value)}>
          <option value="">All moderation states</option>
          <option value="approved">Approved</option>
          <option value="hidden">Hidden</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
              <th>Moderation</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && listings.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">
                    <Gamepad2 size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No listings match this search/filter.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              listings.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      {l.featured && <Star size={13} color="#f59e0b" fill="#f59e0b" />}
                      {l.title}
                    </div>
                  </td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12.5 }}>{l.seller_email}</td>
                  <td style={{ fontWeight: 600 }}>{naira(l.price)}</td>
                  <td><span className="adm-badge adm-badge--neutral">{l.status}</span></td>
                  <td><span className={`adm-badge ${MOD_BADGE[l.moderation_status] || "adm-badge--neutral"}`}>{l.moderation_status}</span></td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(l.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/listings/${l.id}`} className="adm-btn adm-btn--ghost">View</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button className="adm-btn adm-btn--ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
          <span style={{ fontSize: 12.5, color: "var(--adm-ink-500)" }}>Page {page + 1} of {totalPages}</span>
          <button className="adm-btn adm-btn--ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </AdminShell>
  );
}