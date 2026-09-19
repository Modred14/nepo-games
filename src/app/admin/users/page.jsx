// ROUTE: src/app/admin/users/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Search } from "lucide-react";

const STATUS_BADGE = {
  active: "adm-badge--success",
  suspended: "adm-badge--warning",
  banned: "adm-badge--danger",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchUsers = useCallback(async (s, status, p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        limit: String(pageSize),
        offset: String(p * pageSize),
      });
      if (s) qs.set("search", s);
      if (status) qs.set("accountStatus", status);

      const res = await fetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load users");
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search, accountStatus, page), 250);
    return () => clearTimeout(t);
  }, [search, accountStatus, page, fetchUsers]);

  useEffect(() => setPage(0), [search, accountStatus]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <h1 className="adm-h1">Users</h1>
      <p className="adm-sub">{total.toLocaleString()} total users.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <Search
            size={15}
            color="var(--adm-ink-400)"
            style={{ position: "absolute", left: 12, top: 11 }}
          />
          <input
            className="adm-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by email, username, or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="adm-select"
          style={{ maxWidth: 180 }}
          value={accountStatus}
          onChange={(e) => setAccountStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Listings</th>
              <th>Joined</th>
              <th>Last login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8}>
                    <div className="adm-skeleton-row" style={{ border: "none" }} />
                  </td>
                </tr>
              ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="adm-empty">No users match this search/filter.</div>
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {u.first_name} {u.surname}
                    </div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`adm-badge ${STATUS_BADGE[u.account_status] || "adm-badge--neutral"}`}>
                      {u.account_status}
                    </span>
                  </td>
                  <td>
                    {u.role === "admin" ? (
                      <span className="adm-badge adm-badge--blue">Admin</span>
                    ) : (
                      <span style={{ color: "var(--adm-ink-500)" }}>User</span>
                    )}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{u.plan || "—"}</td>
                  <td>{u.listing_count}</td>
                  <td style={{ color: "var(--adm-ink-500)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ color: "var(--adm-ink-500)" }}>
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                  </td>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="adm-btn adm-btn--ghost">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button
            className="adm-btn adm-btn--ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: 12.5, color: "var(--adm-ink-500)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="adm-btn adm-btn--ghost"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </AdminShell>
  );
}