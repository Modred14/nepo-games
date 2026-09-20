// ROUTE: src/app/admin/admins/page.jsx  (NEW)
//
// ADMIN DASHBOARD PHASE 6: admin management. Server-side gating is what
// actually matters (every API call here requires requireSuperAdmin());
// this page just also shows a clean "forbidden" state client-side
// instead of a raw error if a non-super-admin somehow lands here.
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";
import { Search, UserCog } from "lucide-react";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Failed to load admins");
      setAdmins(data.admins || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=5`);
        const data = await res.json();
        setSearchResults(res.ok ? data.users || [] : []);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const promote = async (userId, email) => {
    if (!window.confirm(`Grant admin access to ${email}?`)) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to promote");
      setSearch("");
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (userId, email) => {
    if (!window.confirm(`Revoke admin access from ${email}? They will immediately lose access to every /admin page.`)) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to revoke");
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeTier = async (userId, adminRole, email) => {
    if (!window.confirm(`Make ${email} a ${adminRole.replace("_", " ")}?`)) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${userId}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminRole, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to change tier");
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (forbidden) {
    return (
      <AdminShell>
        <div className="adm-card" style={{ padding: 32, textAlign: "center" }}>
          <UserCog size={24} style={{ opacity: 0.4, marginBottom: 10 }} />
          <h1 className="adm-h1" style={{ fontSize: 16 }}>Super admin only</h1>
          <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5 }}>
            Only a super admin can view or manage other admins.
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="adm-h1">Admins</h1>
      <p className="adm-sub">
        Grant, adjust, or revoke admin access. Super admins can do everything a regular
        admin can, plus manage other admins — grant that tier carefully.
      </p>

      <div className="adm-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Grant admin access</div>
        <div style={{ position: "relative", maxWidth: 360 }}>
          <Search size={15} color="var(--adm-ink-400)" style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            className="adm-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search users by email or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search.trim() && (
          <div style={{ marginTop: 10 }}>
            {searching && <div style={{ fontSize: 12.5, color: "var(--adm-ink-500)" }}>Searching...</div>}
            {!searching && searchResults.length === 0 && (
              <div style={{ fontSize: 12.5, color: "var(--adm-ink-500)" }}>No matching users.</div>
            )}
            {searchResults.map((u) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--adm-line-soft)" }}>
                <div style={{ fontSize: 13 }}>
                  {u.first_name} {u.surname} — <span style={{ color: "var(--adm-ink-500)" }}>{u.email}</span>
                  {u.role === "admin" && <span className="adm-badge adm-badge--blue" style={{ marginLeft: 8 }}>Already admin</span>}
                </div>
                {u.role !== "admin" && (
                  <button className="adm-btn adm-btn--primary" disabled={busy} onClick={() => promote(u.id, u.email)}>
                    Grant admin
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Admin</th><th>Tier</th><th>Status</th><th>Admin since</th><th>Granted by</th><th></th></tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && admins.length === 0 && (
              <tr><td colSpan={6}><div className="adm-empty">No admins yet.</div></td></tr>
            )}
            {!loading &&
              admins.map((a) => (
                <tr key={a.admin_row_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.first_name} {a.surname}</div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{a.email}</div>
                  </td>
                  <td>
                    <span className={`adm-badge ${a.admin_role === "super_admin" ? "adm-badge--warning" : "adm-badge--blue"}`}>
                      {a.admin_role === "super_admin" ? "Super admin" : "Admin"}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${a.disabled_at ? "adm-badge--danger" : "adm-badge--success"}`}>
                      {a.disabled_at ? "Revoked" : "Active"}
                    </span>
                  </td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(a.admin_since).toLocaleDateString()}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{a.created_by_email || "—"}</td>
                  <td>
                    {!a.disabled_at && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {a.admin_role === "admin" ? (
                          <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => changeTier(a.user_id, "super_admin", a.email)}>
                            Make super admin
                          </button>
                        ) : (
                          <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => changeTier(a.user_id, "admin", a.email)}>
                            Demote to admin
                          </button>
                        )}
                        <button className="adm-btn adm-btn--danger" disabled={busy} onClick={() => revoke(a.user_id, a.email)}>
                          Revoke
                        </button>
                      </div>
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