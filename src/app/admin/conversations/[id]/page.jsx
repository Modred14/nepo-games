// ROUTE: src/app/admin/conversations/[id]/page.jsx  (NEW)
//
// Opening this page reads real private message content — every load
// is recorded in admin_audit_log server-side (see
// src/app/api/admin/conversations/[id]/route.js), not just this page's
// existence.
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../_components/AdminShell";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function AdminConversationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/conversations/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load conversation");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <AdminShell><div className="adm-skeleton-row" style={{ height: 300, borderRadius: 16, border: "none" }} /></AdminShell>;
  }
  if (error) {
    return <AdminShell><div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)" }}>{error}</div></AdminShell>;
  }
  if (!data) return null;

  const { conversation: c, messages } = data;

  return (
    <AdminShell>
      <Link href="/admin/conversations" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--adm-ink-500)", textDecoration: "none", marginBottom: 14 }}>
        <ArrowLeft size={14} /> All conversations
      </Link>

      <div className="adm-card" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--adm-ink-500)" }}>
        <ShieldAlert size={14} />
        Viewing this conversation's messages has been recorded in the audit log.
      </div>

      <h1 className="adm-h1" style={{ fontSize: 18 }}>
        {c.sender_email} ↔ {c.receiver_email}
      </h1>
      <p className="adm-sub">{c.listing_title || "No associated listing"}</p>

      <div className="adm-card" style={{ padding: 20 }}>
        {messages.length === 0 && <div className="adm-empty">No messages in this conversation.</div>}
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--adm-line-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--adm-ink-400)", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: "var(--adm-ink-700)" }}>{m.sender_email || "System"}</span>
              <span>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13.5 }}>{m.message}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}