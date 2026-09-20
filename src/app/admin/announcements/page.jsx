// ROUTE: src/app/admin/announcements/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";
import { Megaphone, Trash2 } from "lucide-react";

const TYPE_BADGE = {
  info: "adm-badge--blue",
  warning: "adm-badge--warning",
  promo: "adm-badge--success",
  maintenance: "adm-badge--danger",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", startsAt: "", endsAt: "" });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load announcements");
      setAnnouncements(data.announcements || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/system-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create announcement");
      setForm({ title: "", message: "", type: "info", startsAt: "", endsAt: "" });
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (a) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/system-messages/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !a.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this announcement permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/system-messages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <h1 className="adm-h1">Announcements</h1>
      <p className="adm-sub">
        Shown to every logged-in user in their notification inbox. Disabled or
        out-of-schedule announcements are hidden automatically — deleting isn't required
        to take one down.
      </p>

      <form onSubmit={create} className="adm-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>New announcement</div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 160px" }}>
          <input
            className="adm-input"
            placeholder="Title (optional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select className="adm-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="promo">Promo</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <textarea
          className="adm-input"
          style={{ marginTop: 12, minHeight: 80, resize: "vertical" }}
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, color: "var(--adm-ink-500)", display: "block", marginBottom: 4 }}>
              Starts (optional — blank means immediately)
            </label>
            <input
              className="adm-input"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: "var(--adm-ink-500)", display: "block", marginBottom: 4 }}>
              Ends (optional — blank means indefinitely)
            </label>
            <input
              className="adm-input"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
        </div>
        <button className="adm-btn adm-btn--primary" style={{ marginTop: 16 }} disabled={busy || !form.message.trim()}>
          {busy ? "Publishing..." : "Publish announcement"}
        </button>
      </form>

      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Announcement</th><th>Type</th><th>Status</th><th>Window</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="adm-skeleton-row" style={{ border: "none" }} /></td></tr>
              ))}
            {!loading && announcements.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="adm-empty">
                    <Megaphone size={22} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>No announcements yet.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              announcements.map((a) => (
                <tr key={a.id}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontWeight: 600 }}>{a.title || "(untitled)"}</div>
                    <div style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{a.message}</div>
                  </td>
                  <td><span className={`adm-badge ${TYPE_BADGE[a.type] || "adm-badge--neutral"}`}>{a.type}</span></td>
                  <td>
                    <button
                      className={`adm-badge ${a.enabled ? "adm-badge--success" : "adm-badge--neutral"}`}
                      style={{ border: "none", cursor: "pointer" }}
                      disabled={busy}
                      onClick={() => toggleEnabled(a)}
                    >
                      {a.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>
                    {a.starts_at ? new Date(a.starts_at).toLocaleDateString() : "Always"} –{" "}
                    {a.ends_at ? new Date(a.ends_at).toLocaleDateString() : "indefinite"}
                  </td>
                  <td style={{ color: "var(--adm-ink-500)", fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(a.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}