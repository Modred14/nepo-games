// ROUTE: src/app/admin/conversations/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminShell from "../_components/AdminShell";
import { Search, MessageCircle } from "lucide-react";

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConvos = useCallback(async (s) => {
    setLoading(true);
    try {
      const qs = s ? `?search=${encodeURIComponent(s)}` : "";
      const res = await fetch(`/api/admin/conversations${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load conversations");
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchConvos(search), 250);
    return () => clearTimeout(t);
  }, [search, fetchConvos]);

  return (
    <AdminShell>
      <h1 className="adm-h1">Conversations</h1>
      <p className="adm-sub">
        {total.toLocaleString()} conversations. Search doesn't expose message content — opening
        one to read messages is a separate, audit-logged step.
      </p>

      <div style={{ position: "relative", maxWidth: 360, marginBottom: 18 }}>
        <Search size={15} color="var(--adm-ink-400)" style={{ position: "absolute", left: 12, top: 11 }} />
        <input
          className="adm-input"
          style={{ paddingLeft: 34 }}
          placeholder="Search by participant email or listing"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Participants</th><th>Listing</th><th>Messages</th><th>Last activity</th><th></th></tr></thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && conversations.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="adm-empty">
                    <MessageCircle size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No conversations match this search.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              conversations.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 12.5 }}>{c.sender_email} ↔ {c.receiver_email}</td>
                  <td style={{ color: "var(--adm-ink-500)" }}>{c.listing_title || "—"}</td>
                  <td>{c.message_count}</td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "—"}
                  </td>
                  <td><Link href={`/admin/conversations/${c.id}`} className="adm-btn adm-btn--ghost">View</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}