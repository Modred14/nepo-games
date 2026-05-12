"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  Headphones,
  User,
  RefreshCw,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Users,
  Zap,
  Filter,
} from "lucide-react";

// ─── tiny relative time ───────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-start" : "flex-end",
        marginBottom: 10,
      }}
    >
      {isUser && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#e8e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
          }}
        >
          <User size={12} color="#6b7280" />
        </div>
      )}
      <div
        style={{
          maxWidth: "72%",
          padding: "9px 13px",
          borderRadius: isUser ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
          background: isUser
            ? "#f1f1f5"
            : "linear-gradient(135deg,#0000FF,#4f5fff)",
          color: isUser ? "#1a1a2e" : "#fff",
          fontSize: 13,
          lineHeight: 1.55,
          boxShadow: isUser
            ? "0 1px 4px rgba(0,0,0,.07)"
            : "0 2px 10px rgba(0,0,255,.22)",
        }}
      >
        <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
        <div
          style={{
            fontSize: 10,
            marginTop: 3,
            opacity: 0.5,
            textAlign: "right",
          }}
        >
          {isUser ? "User" : "Agent/Bot"} · {timeAgo(msg.created_at)}
        </div>
      </div>
    </div>
  );
}

// ─── SESSION LIST ITEM ────────────────────────────────────────────────────────
function SessionItem({ s, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        background: active ? "rgba(0,0,255,.06)" : "transparent",
        border: "none",
        borderBottom: "1px solid rgba(122,122,254,.1)",
        cursor: "pointer",
        transition: "background .15s",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "rgba(0,0,255,.03)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          flexShrink: 0,
          background: active ? "#0000FF" : "#e8e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <User size={15} color={active ? "#fff" : "#6b7280"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
            {s.username || s.email || "Guest"}
          </span>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>
            {timeAgo(s.created_at)}
          </span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#6b7280",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {s.last_message || "No messages yet"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 999,
              background: s.mode === "human" ? "#fef3c7" : "rgba(0,0,255,.08)",
              color: s.mode === "human" ? "#92400e" : "#0000FF",
            }}
          >
            {s.mode === "human" ? "🧑 Human" : "🤖 Bot"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#9ca3af",
            }}
          >
            {s.message_count} msg{s.message_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function SupportDashboard() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [filter, setFilter] = useState("all"); // all | bot | human
  const initRef = useRef(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId);

  // ── fetch sessions ────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoadingSessions(true);
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(true), 8000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // ── fetch messages for active session ────────────────────────────────────
  const fetchMessages = useCallback(async (sid) => {
    if (!initRef.current) {
      setLoadingMessages(true);
      initRef.current = true;
    }

    try {
      const res = await fetch(`/api/chat/history?sessionId=${sid}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId);
    const interval = setInterval(() => fetchMessages(activeId), 4000);
    return () => clearInterval(interval);
  }, [activeId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── take over ─────────────────────────────────────────────────────────────
  const handleTakeover = async () => {
    if (!activeId) return;
    setTakingOver(true);
    try {
      await fetch("/api/chat/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeId }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, mode: "human" } : s)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTakingOver(false);
    }
  };

  // ── send agent reply ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      await fetch("/api/chat/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeId, agentMessage: text }),
      });
      setReply("");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId ? { ...s, mode: "human", last_message: text } : s,
        ),
      );
      await fetchMessages(activeId);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = sessions.filter(
    (s) => filter === "all" || s.mode === filter,
  );

  const stats = {
    total: sessions.length,
    bot: sessions.filter((s) => s.mode === "bot").length,
    human: sessions.filter((s) => s.mode === "human").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Sora',sans-serif; background:#f4f4f9; color:#1a1a2e; }

        @keyframes spinIt { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .dash-root {
          display:flex; flex-direction:column; height:100vh;
          font-family:'Sora',sans-serif; background:#f4f4f9;
        }

        /* topbar */
        .dash-topbar {
          background:#fff; border-bottom:1px solid rgba(122,122,254,.15);
          padding:0 24px; height:60px;
          display:flex; align-items:center; justify-content:space-between;
          flex-shrink:0; gap:16px;
        }
        .dash-logo { display:flex; align-items:center; gap:10px; }
        .dash-logo-mark {
          width:34px; height:34px; border-radius:50%; background:#0000FF;
          display:flex; align-items:center; justify-content:center;
        }
        .dash-logo-text { font-size:15px; font-weight:700; color:#1a1a2e; }
        .dash-logo-sub { font-size:11px; color:#9ca3af; font-weight:400; }
        .dash-stats { display:flex; gap:8px; }
        .dash-stat {
          display:flex; align-items:center; gap:6px;
          background:#f4f4f9; border:1px solid rgba(122,122,254,.15);
          border-radius:10px; padding:6px 12px;
          font-size:12px; font-weight:600; color:#1a1a2e;
        }
        .dash-refresh {
          display:flex; align-items:center; gap:6px;
          background:none; border:1px solid rgba(122,122,254,.25);
          border-radius:10px; padding:6px 12px; cursor:pointer;
          font-family:'Sora',sans-serif; font-size:12px; color:#6b7280;
          transition:background .15s, color .15s;
        }
        .dash-refresh:hover { background:rgba(0,0,255,.05); color:#0000FF; }

        /* layout */
        .dash-body { display:flex; flex:1; overflow:hidden; }

        /* sidebar */
        .dash-sidebar {
          width:300px; flex-shrink:0; background:#fff;
          border-right:1px solid rgba(122,122,254,.12);
          display:flex; flex-direction:column; overflow:hidden;
        }
        .dash-sidebar-head {
          padding:14px 16px; border-bottom:1px solid rgba(122,122,254,.1);
          flex-shrink:0;
        }
        .dash-sidebar-title { font-size:13px; font-weight:700; color:#1a1a2e; margin-bottom:10px; }
        .dash-filters { display:flex; gap:6px; }
        .dash-filter-btn {
          flex:1; padding:6px 0; border-radius:8px; border:1px solid rgba(122,122,254,.2);
          background:none; cursor:pointer; font-family:'Sora',sans-serif;
          font-size:11px; font-weight:600; color:#6b7280;
          transition:all .15s;
        }
        .dash-filter-btn.active { background:#0000FF; color:#fff; border-color:#0000FF; }
        .dash-session-list { flex:1; overflow-y:auto; }
        .dash-session-list::-webkit-scrollbar { width:3px; }
        .dash-session-list::-webkit-scrollbar-thumb { background:rgba(0,0,255,.15); border-radius:3px; }
        .dash-empty {
          padding:32px 16px; text-align:center;
          color:#9ca3af; font-size:13px;
        }

        /* chat area */
        .dash-chat { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .dash-chat-head {
          background:#fff; border-bottom:1px solid rgba(122,122,254,.12);
          padding:12px 20px; display:flex; align-items:center; gap:12px; flex-shrink:0;
        }
        .dash-chat-user { flex:1; }
        .dash-chat-name { font-size:14px; font-weight:600; }
        .dash-chat-meta { font-size:11px; color:#9ca3af; margin-top:2px; }
        .dash-takeover-btn {
          display:flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:10px; border:none; cursor:pointer;
          font-family:'Sora',sans-serif; font-size:12px; font-weight:600;
          background:linear-gradient(135deg,#0000FF,#4f5fff); color:#fff;
          box-shadow:0 3px 10px rgba(0,0,255,.25);
          transition:opacity .2s, transform .15s;
        }
        .dash-takeover-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
        .dash-takeover-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .dash-human-badge {
          display:flex; align-items:center; gap:5px;
          padding:6px 12px; border-radius:10px;
          background:#fef9c3; border:1px solid #fde047;
          font-size:11px; font-weight:600; color:#854d0e;
        }
        .dash-messages {
          flex:1; overflow-y:auto; padding:20px;
          background:#fafafa;
        }
        .dash-messages::-webkit-scrollbar { width:4px; }
        .dash-messages::-webkit-scrollbar-thumb { background:rgba(0,0,255,.1); border-radius:4px; }
        .dash-input-row {
          background:#fff; border-top:1px solid rgba(122,122,254,.12);
          padding:12px 16px; display:flex; gap:10px; align-items:flex-end; flex-shrink:0;
        }
        .dash-textarea {
          flex:1; border:1px solid rgba(122,122,254,.22);
          border-radius:14px; padding:10px 14px;
          font-family:'Sora',sans-serif; font-size:13px;
          color:#1a1a2e; background:#fafafa; resize:none;
          outline:none; max-height:100px; min-height:40px; line-height:1.5;
          transition:border-color .2s, box-shadow .2s;
        }
        .dash-textarea::placeholder { color:#aaa; }
        .dash-textarea:focus {
          border-color:#0000FF; background:#fff;
          box-shadow:0 0 0 3px rgba(0,0,255,.07);
        }
        .dash-send-btn {
          width:40px; height:40px; border-radius:50%; border:none;
          background:linear-gradient(135deg,#0000FF,#4f5fff);
          color:#fff; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,255,.25);
          transition:opacity .2s, transform .15s;
        }
        .dash-send-btn:hover:not(:disabled) { opacity:.88; transform:scale(1.06); }
        .dash-send-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }

        .dash-no-chat {
          flex:1; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:12px;
          color:#9ca3af; animation:fadeIn .3s ease;
        }
        .dash-no-chat-icon {
          width:60px; height:60px; border-radius:50%;
          background:rgba(0,0,255,.06); display:flex;
          align-items:center; justify-content:center;
        }
        @media(max-width:768px){
          .dash-sidebar { width:240px; }
          .dash-stats { display:none; }
        }
      `}</style>

      <div className="dash-root">
        {/* topbar */}
        <div className="dash-topbar">
          <div className="dash-logo">
            <div className="dash-logo-mark">
              <Headphones size={16} color="#fff" />
            </div>
            <div>
              <div className="dash-logo-text">Support Dashboard</div>
              <div className="dash-logo-sub">Nepo Games · Admin</div>
            </div>
          </div>

          <div className="dash-stats">
            <div className="dash-stat">
              <Users size={13} color="#0000FF" />
              {stats.total} total
            </div>
            <div className="dash-stat">
              <Bot size={13} color="#8A38F5" />
              {stats.bot} bot
            </div>
            <div className="dash-stat">
              <Headphones size={13} color="#f59e0b" />
              {stats.human} human
            </div>
          </div>

          <button className="dash-refresh" onClick={() => fetchSessions()}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        <div className="dash-body">
          {/* session list */}
          <div className="dash-sidebar">
            <div className="dash-sidebar-head">
              <div className="dash-sidebar-title">Active Chats</div>
              <div className="dash-filters">
                {["all", "bot", "human"].map((f) => (
                  <button
                    key={f}
                    className={`dash-filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f === "bot" ? "🤖 Bot" : "🧑 Human"}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-session-list">
              {loadingSessions ? (
                <div className="dash-empty">
                  <Loader2
                    size={20}
                    style={{
                      animation: "spinIt 1s linear infinite",
                      margin: "0 auto 8px",
                      display: "block",
                    }}
                  />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="dash-empty">
                  <MessageSquare
                    size={24}
                    style={{
                      margin: "0 auto 8px",
                      display: "block",
                      opacity: 0.4,
                    }}
                  />
                  No active chats
                </div>
              ) : (
                filtered.map((s) => (
                  <SessionItem
                    key={s.id}
                    s={s}
                    active={s.id === activeId}
                    onClick={() => setActiveId(s.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* chat panel */}
          <div className="dash-chat">
            {!activeId ? (
              <div className="dash-no-chat">
                <div className="dash-no-chat-icon">
                  <MessageSquare size={26} color="#0000FF" />
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}
                >
                  Select a conversation
                </div>
                <div style={{ fontSize: 12 }}>
                  Pick a chat from the left to view messages
                </div>
              </div>
            ) : (
              <>
                {/* chat header */}
                <div className="dash-chat-head">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(0,0,255,.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} color="#0000FF" />
                  </div>
                  <div className="dash-chat-user">
                    <div className="dash-chat-name">
                      {activeSession?.username ||
                        activeSession?.email ||
                        "Guest User"}
                    </div>
                    <div className="dash-chat-meta">
                      Session · {activeId?.slice(0, 8)}… · started{" "}
                      {timeAgo(activeSession?.created_at)}
                    </div>
                  </div>

                  {activeSession?.mode === "human" ? (
                    <div className="dash-human-badge">
                      <Headphones size={12} /> Human mode active
                    </div>
                  ) : (
                    <button
                      className="dash-takeover-btn"
                      onClick={handleTakeover}
                      disabled={takingOver}
                    >
                      {takingOver ? (
                        <Loader2
                          size={13}
                          style={{ animation: "spinIt 1s linear infinite" }}
                        />
                      ) : (
                        <Zap size={13} />
                      )}
                      Take Over
                    </button>
                  )}
                </div>

                {/* messages */}
                <div className="dash-messages">
                  {loadingMessages ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "#9ca3af",
                        fontSize: 13,
                      }}
                    >
                      <Loader2
                        size={18}
                        style={{
                          animation: "spinIt 1s linear infinite",
                          display: "inline-block",
                        }}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "#9ca3af",
                        fontSize: 13,
                      }}
                    >
                      No messages yet
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => (
                        <Bubble key={i} msg={msg} />
                      ))}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* reply box */}
                <div className="dash-input-row">
                  {activeSession?.mode !== "human" && (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: 72,
                        background: "rgba(0,0,0,.7)",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "5px 12px",
                        fontSize: 11,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Click "Take Over" first to reply
                    </div>
                  )}
                  <textarea
                    className="dash-textarea"
                    placeholder={
                      activeSession?.mode === "human"
                        ? "Type your reply…"
                        : "Take over the chat to reply…"
                    }
                    value={reply}
                    rows={1}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={activeSession?.mode !== "human" || sending}
                    ref={textareaRef}
                  />
                  <button
                    className="dash-send-btn"
                    onClick={handleSend}
                    disabled={
                      !reply.trim() ||
                      activeSession?.mode !== "human" ||
                      sending
                    }
                  >
                    {sending ? (
                      <Loader2
                        size={15}
                        style={{ animation: "spinIt 1s linear infinite" }}
                      />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
