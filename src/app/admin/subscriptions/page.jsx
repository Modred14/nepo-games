// ROUTE: src/app/admin/subscriptions/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Search, CreditCard } from "lucide-react";

const PLAN_BADGE = { pro: "adm-badge--blue", plus: "adm-badge--success", premium: "adm-badge--warning" };

export default function AdminSubscriptionsPage() {
  const searchParams = useSearchParams();
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(searchParams.get("expiringOnly") === "true");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchSubs = useCallback(async (s, p, exp, pg) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(pageSize), offset: String(pg * pageSize) });
      if (s) qs.set("search", s);
      if (p) qs.set("plan", p);
      if (exp) qs.set("expiringOnly", "true");
      const res = await fetch(`/api/admin/subscriptions?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load subscribers");
      setSubscribers(data.subscribers || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSubs(search, plan, expiringOnly, page), 250);
    return () => clearTimeout(t);
  }, [search, plan, expiringOnly, page, fetchSubs]);

  useEffect(() => setPage(0), [search, plan, expiringOnly]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <h1 className="adm-h1">Subscriptions</h1>
      <p className="adm-sub">{total.toLocaleString()} paying subscribers (Pro/Plus/Premium). Free users aren't listed here.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <Search size={15} color="var(--adm-ink-400)" style={{ position: "absolute", left: 12, top: 11 }} />
          <input className="adm-input" style={{ paddingLeft: 34 }} placeholder="Search by email or username" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="adm-select" style={{ maxWidth: 160 }} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="">All plans</option>
          <option value="pro">Pro</option>
          <option value="plus">Plus</option>
          <option value="premium">Premium</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-700)" }}>
          <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} />
          Expiring within 7 days
        </label>
      </div>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>User</th><th>Plan</th><th>Status</th><th>Started</th><th>Expires</th><th></th></tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && subscribers.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="adm-empty">
                    <CreditCard size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No subscribers match this search/filter.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              subscribers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.first_name} {s.surname}</div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{s.email}</div>
                  </td>
                  <td><span className={`adm-badge ${PLAN_BADGE[s.plan] || "adm-badge--neutral"}`}>{s.plan}</span></td>
                  <td><span className={`adm-badge ${s.subscription_status === "active" ? "adm-badge--success" : "adm-badge--neutral"}`}>{s.subscription_status}</span></td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{s.subscription_start ? new Date(s.subscription_start).toLocaleDateString() : "—"}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{s.subscription_end ? new Date(s.subscription_end).toLocaleDateString() : "—"}</td>
                  <td><Link href={`/admin/subscriptions/${s.id}`} className="adm-btn adm-btn--ghost">Manage</Link></td>
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