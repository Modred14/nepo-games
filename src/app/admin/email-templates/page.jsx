// ROUTE: src/app/admin/email-templates/page.jsx  (NEW)
//
// Read-only viewer for what Nepo Games' 8 separate transactional emails
// actually say. There is no edit capability here — see the banner below
// and src/app/admin/_data/emailTemplates.js for why: 8 scattered files
// with no shared template system, two of them being password reset and
// OTP verification, means "just add an editor" would mean refactoring
// live account-security flows, which wasn't done without explicit
// sign-off.
"use client";

import { useState, useEffect } from "react";
import AdminShell from "../_components/AdminShell";
import { Mail, Code2, Info } from "lucide-react";

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/email-templates");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load templates");
        setTemplates(data.templates || []);
        setActiveId(data.templates?.[0]?.id || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = templates.find((t) => t.id === activeId);

  return (
    <AdminShell>
      <h1 className="adm-h1">Email templates</h1>
      <p className="adm-sub">
        What Nepo Games actually sends, for reference — read-only.
      </p>

      <div
        className="adm-card"
        style={{
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          background: "var(--adm-warning-bg)",
          borderColor: "var(--adm-warning-line)",
        }}
      >
        <Info size={16} color="var(--adm-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: "var(--adm-warning)", lineHeight: 1.5 }}>
          <strong>This page can't edit anything, on purpose.</strong> These 8 emails live in 8
          separate files with no shared template system — including password reset and login
          verification codes. Editing them safely from here would require refactoring those live
          flows first, which hasn't been done. What you see below is a snapshot: entries marked
          "Exact copy" were verified verbatim against the live source; entries marked "Summary
          only" show accurate subject lines and a plain-English description rather than risk
          showing a subtly-wrong reconstruction as if it were the real thing.
        </div>
      </div>

      {loading && <div className="adm-skeleton-row" style={{ height: 300, borderRadius: 16, border: "none" }} />}
      {error && <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
          <div className="adm-table-wrap">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  border: "none",
                  borderBottom: "1px solid var(--adm-line-soft)",
                  background: activeId === t.id ? "var(--adm-line-soft)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "var(--adm-ink-500)", marginTop: 2 }}>
                  {t.previewFidelity === "verbatim" ? "Exact copy" : "Summary only"}
                </div>
              </button>
            ))}
          </div>

          {active && (
            <div>
              <div className="adm-card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Mail size={16} color="var(--adm-ink-500)" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{active.subject}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--adm-ink-500)", marginBottom: 10 }}>{active.trigger}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {active.triggerFiles.map((f) => (
                    <span key={f} className="adm-badge adm-badge--neutral" style={{ fontFamily: "monospace", textTransform: "none" }}>
                      {f}
                    </span>
                  ))}
                </div>
                {active.dynamicVariables?.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--adm-ink-500)" }}>
                    <Code2 size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                    Dynamic values: {active.dynamicVariables.join(", ")}
                  </div>
                )}
                {active.note && (
                  <div style={{ fontSize: 12, color: "var(--adm-warning)", marginTop: 10 }}>{active.note}</div>
                )}
              </div>

              {active.previewFidelity === "verbatim" ? (
                <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
                  <iframe
                    title={active.name}
                    srcDoc={active.htmlPreview}
                    sandbox="allow-same-origin"
                    style={{ width: "100%", height: 560, border: "none", display: "block" }}
                  />
                </div>
              ) : (
                <div className="adm-card" style={{ padding: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>What this email says</div>
                  <p style={{ fontSize: 13, color: "var(--adm-ink-700)", lineHeight: 1.6 }}>{active.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}