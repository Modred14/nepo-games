// ROUTE: src/app/admin/users/[id]/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const TABS = ["Listings", "Purchases", "Sales", "Wallet", "Withdrawals", "Disputes"];

function naira(n) {
  return `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const STATUS_BADGE = {
  active: "adm-badge--success",
  suspended: "adm-badge--warning",
  banned: "adm-badge--danger",
  success: "adm-badge--success",
  completed: "adm-badge--success",
  pending: "adm-badge--warning",
  processing: "adm-badge--warning",
  unknown: "adm-badge--warning",
  failed: "adm-badge--danger",
  cancelled: "adm-badge--neutral",
  refunded: "adm-badge--neutral",
};

function Badge({ value }) {
  if (!value) return "—";
  return (
    <span className={`adm-badge ${STATUS_BADGE[value] || "adm-badge--neutral"}`}>{value}</span>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("Listings");
  const [busy, setBusy] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load user");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const changeStatus = async (status) => {
    const labels = {
      active: "restore this account to active",
      suspended: "suspend this account",
      banned: "ban this account",
    };
    if (!window.confirm(`Are you sure you want to ${labels[status]}?`)) return;

    const reason = window.prompt(
      "Optional: add a reason (recorded in the audit log)",
      "",
    );

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reason || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update status");
      fetchUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMessagingRestriction = async (restricted) => {
    if (!window.confirm(restricted ? "Restrict this user from sending new messages?" : "Lift the messaging restriction?")) return;
    const reason = window.prompt("Optional: add a reason (recorded in the audit log)", "");

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/messaging-restriction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restricted, reason: reason || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      fetchUser();
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

  const { user, listings, purchases, sales, walletTransactions, withdrawals, disputes } = data;

  return (
    <AdminShell>
      <Link
        href="/admin/users"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: "var(--adm-ink-500)",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={14} /> All users
      </Link>

      <div
        className="adm-card"
        style={{ padding: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 className="adm-h1" style={{ margin: 0 }}>
              {user.first_name} {user.surname}
            </h1>
            <Badge value={user.account_status} />
            {user.role === "admin" && <span className="adm-badge adm-badge--blue">Admin</span>}
            {user.messaging_restricted && <span className="adm-badge adm-badge--danger">Messaging restricted</span>}
          </div>
          <p style={{ color: "var(--adm-ink-500)", fontSize: 13.5, margin: 0 }}>
            {user.email} · @{user.username}
          </p>
          <p style={{ color: "var(--adm-ink-400)", fontSize: 12, marginTop: 6 }}>
            Joined {new Date(user.created_at).toLocaleDateString()} · Last login{" "}
            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"} ·
            Plan: <span style={{ textTransform: "capitalize" }}>{user.plan || "free"}</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignContent: "flex-start" }}>
          {user.account_status !== "active" && (
            <button
              className="adm-btn adm-btn--success"
              disabled={busy}
              onClick={() => changeStatus("active")}
            >
              Restore account
            </button>
          )}
          {user.account_status !== "suspended" && (
            <button
              className="adm-btn adm-btn--ghost"
              disabled={busy}
              onClick={() => changeStatus("suspended")}
            >
              Suspend
            </button>
          )}
          {user.account_status !== "banned" && (
            <button
              className="adm-btn adm-btn--danger"
              disabled={busy}
              onClick={() => changeStatus("banned")}
            >
              Ban
            </button>
          )}
          <button
            className="adm-btn adm-btn--ghost"
            disabled={busy}
            onClick={() => toggleMessagingRestriction(!user.messaging_restricted)}
          >
            {user.messaging_restricted ? "Lift messaging restriction" : "Restrict from messaging"}
          </button>
        </div>
      </div>

      <div className="adm-tabs" style={{ marginTop: 24 }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`adm-tab ${tab === t ? "adm-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Listings" && (
        <DataTable
          rows={listings}
          empty="No listings yet."
          columns={[
            { key: "title", label: "Title" },
            { key: "price", label: "Price", render: (r) => naira(r.price) },
            { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
            { key: "created_at", label: "Created", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}

      {tab === "Purchases" && (
        <DataTable
          rows={purchases}
          empty="No purchases yet."
          columns={[
            { key: "listing_title", label: "Listing", render: (r) => r.listing_title || "—" },
            { key: "amount", label: "Amount", render: (r) => naira(r.amount) },
            { key: "escrow_status", label: "Escrow", render: (r) => <Badge value={r.escrow_status} /> },
            { key: "transaction_status", label: "Status", render: (r) => <Badge value={r.transaction_status} /> },
            { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}

      {tab === "Sales" && (
        <DataTable
          rows={sales}
          empty="No sales yet."
          columns={[
            { key: "listing_title", label: "Listing", render: (r) => r.listing_title || "—" },
            { key: "amount", label: "Amount", render: (r) => naira(r.amount) },
            { key: "escrow_status", label: "Escrow", render: (r) => <Badge value={r.escrow_status} /> },
            { key: "transaction_status", label: "Status", render: (r) => <Badge value={r.transaction_status} /> },
            { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}

      {tab === "Wallet" && (
        <DataTable
          rows={walletTransactions}
          empty="No wallet activity yet."
          columns={[
            { key: "description", label: "Description" },
            { key: "type", label: "Type", render: (r) => (r.type === "credit" ? "+ Credit" : "– Debit") },
            { key: "amount", label: "Amount", render: (r) => naira(r.amount) },
            { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
            { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}

      {tab === "Withdrawals" && (
        <DataTable
          rows={withdrawals}
          empty="No withdrawals yet."
          columns={[
            { key: "amount", label: "Amount", render: (r) => naira(r.amount) },
            { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
            { key: "reference", label: "Reference" },
            { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}

      {tab === "Disputes" && (
        <DataTable
          rows={disputes}
          empty="No open disputes involving this user."
          columns={[
            { key: "amount", label: "Amount", render: (r) => naira(r.amount) },
            { key: "escrow_status", label: "Escrow", render: (r) => <Badge value={r.escrow_status} /> },
            { key: "created_at", label: "Opened", render: (r) => new Date(r.created_at).toLocaleDateString() },
            {
              key: "actions",
              label: "",
              render: () => (
                <Link href="/admin/disputes" className="adm-btn adm-btn--ghost">
                  Go to Disputes
                </Link>
              ),
            },
          ]}
        />
      )}
    </AdminShell>
  );
}

function DataTable({ rows, columns, empty }) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                <div className="adm-empty">{empty}</div>
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}