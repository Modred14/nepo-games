"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  Loader2,
  Minimize2,
  Maximize2,
  Headphones,
  UserCheck,
  Clock,
} from "lucide-react";

function getStoredSession() {
  try {
    return localStorage.getItem("nepo_chat_session");
  } catch {
    return null;
  }
}
function storeSession(id) {
  try {
    localStorage.setItem("nepo_chat_session", id);
  } catch {}
}

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "10px 14px",
        background: "#f1f1f5",
        borderRadius: "18px 18px 18px 4px",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#0000FF",
            display: "inline-block",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 10,
          animation: "bubbleIn .2s ease",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,255,.06)",
            border: "1px solid rgba(0,0,255,.12)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 11,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#0000FF",
              flexShrink: 0,
            }}
          />
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
        animation: "bubbleIn .2s ease",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#0000FF,#4F60FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
            boxShadow: "0 2px 8px rgba(0,0,255,.25)",
          }}
        >
          <Bot size={13} color="#fff" strokeWidth={2} />
        </div>
      )}
      <div
        style={{
          maxWidth: "76%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg,#0000FF,#4f5fff)"
            : "#f1f1f5",
          color: isUser ? "#fff" : "#1a1a2e",
          fontSize: 13.5,
          lineHeight: 1.6,
          boxShadow: isUser
            ? "0 2px 10px rgba(0,0,255,.22)"
            : "0 1px 4px rgba(0,0,0,.07)",
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
          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInit] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  // mode: "bot" | "pending" | "human"
  const [mode, setMode] = useState("bot");
  const [minimized, setMinimized] = useState(false);
  const [requestingHuman, setRequestingHuman] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Init session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      setInit(true);
      const stored = getStoredSession();
      try {
        const res = await fetch("/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: stored }),
        });
        const data = await res.json();
        const sid = data.session.id;
        setSessionId(sid);
        storeSession(sid);
        setMode(data.session.mode || "bot");

        const histRes = await fetch(`/api/chat/history?sessionId=${sid}`);
        const histData = await histRes.json();

        if (histData.messages?.length) {
          setMessages(histData.messages);
        } else {
          setMessages([
            {
              role: "assistant",
              text: "Hey! 👋 I'm the Nepogames support bot. I can help with account issues, trades, payments, and more.\n\nWhat can I help you with today?",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInit(false);
      }
    };
    init();
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !minimized && !initializing) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, minimized, initializing]);

  // ── Poll when human or pending ────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !isOpen) return;
    if (mode !== "human" && mode !== "pending") return;

    const interval = setInterval(async () => {
      try {
        // Check mode change (pending → human)
        if (mode === "pending") {
          const res = await fetch(
            `/api/chat/session-status?sessionId=${sessionId}`,
          );
          const data = await res.json();
          if (data.mode === "human") {
            setMode("human");
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                text: "A support agent has joined the conversation.",
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }

        // Always pull latest messages in human mode
        if (mode === "human") {
          const histRes = await fetch(
            `/api/chat/history?sessionId=${sessionId}`,
          );
          const histData = await histRes.json();
          if (histData.messages?.length > messages.length) {
            setMessages(histData.messages);
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, mode, isOpen, messages.length]);

  // ── Request human agent ───────────────────────────────────────────────────
  const requestHuman = useCallback(async () => {
    if (!sessionId || requestingHuman) return;
    setRequestingHuman(true);
    try {
      await fetch("/api/chat/request-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setMode("pending");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: "You've requested a live agent. Please hold on — someone will join shortly.",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Request human error:", err);
    } finally {
      setRequestingHuman(false);
    }
  }, [sessionId, requestingHuman]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    const userMsg = {
      role: "user",
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // In pending/human mode — just save the message, no bot reply
    if (mode === "pending" || mode === "human") {
      await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userMessage: text, skipBot: true }),
      });
      return;
    }

    // Bot mode — normal flow
    setLoading(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userMessage: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      if (data.mode) setMode(data.mode);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, mode]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  // ── Derive header label ───────────────────────────────────────────────────
  const headerStatus = {
    bot: {
      icon: <Bot size={17} />,
      label: "AI Assistant • Online",
      badge: "🤖 Bot",
      dot: "#22c55e",
    },
    pending: {
      icon: <Clock size={17} />,
      label: "Waiting for an agent…",
      badge: "⏳ Pending",
      dot: "#f59e0b",
    },
    human: {
      icon: <Headphones size={17} />,
      label: "Connected to live agent",
      badge: "🧑 Human",
      dot: "#22c55e",
    },
  }[mode];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');
        @keyframes bubbleIn {
          from { opacity:0; transform:translateY(6px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes typingBounce {
          0%,60%,100% { transform:translateY(0); }
          30% { transform:translateY(-5px); }
        }
        @keyframes widgetSlideUp {
          from { opacity:0; transform:translateY(20px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% 0; }
          100% { background-position:200% 0; }
        }
        @keyframes spinIt { to { transform:rotate(360deg); } }
        @keyframes pendingPulse {
          0%,100% { opacity:1; }
          50% { opacity:.4; }
        }
        .nepo-chat-wrap {
          position:fixed; bottom:24px; right:24px; z-index:9999;
          width:380px;
          animation: widgetSlideUp .3s cubic-bezier(.22,1,.36,1);
          font-family:'Sora',sans-serif;
        }
        @media(max-width:480px){
          .nepo-chat-wrap { width:calc(100vw - 24px); right:12px; bottom:12px; }
        }
        .nepo-chat-box {
          background:#fff; border-radius:24px;
          border:1px solid rgba(122,122,254,.2);
          box-shadow:0 20px 60px rgba(0,0,255,.12), 0 4px 20px rgba(0,0,0,.08);
          overflow:hidden; display:flex; flex-direction:column;
        }
        .nepo-chat-header {
          background:linear-gradient(135deg,#0000FF,#4F60FF);
          padding:14px 16px; display:flex; align-items:center; gap:10px;
          color:#fff; flex-shrink:0;
        }
        .nepo-chat-avatar {
          width:38px; height:38px; border-radius:50%;
          background:rgba(255,255,255,.2);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; position:relative;
        }
        .nepo-online-dot {
          position:absolute; bottom:1px; right:1px;
          width:10px; height:10px; border-radius:50%;
          border:2px solid #2244ff;
          transition: background .4s;
        }
        .nepo-hdr-info { flex:1; }
        .nepo-hdr-name { font-size:14px; font-weight:600; }
        .nepo-hdr-status { font-size:11px; opacity:.8; margin-top:1px; display:flex; align-items:center; gap:4px; }
        .nepo-hdr-btn {
          background:rgba(255,255,255,.15); border:none; cursor:pointer;
          width:28px; height:28px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          color:#fff; transition:background .2s; flex-shrink:0;
        }
        .nepo-hdr-btn:hover { background:rgba(255,255,255,.28); }
        .nepo-mode-badge {
          background:rgba(255,255,255,.18); border-radius:999px;
          padding:3px 9px; font-size:10px; font-weight:600;
          display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
        }
        .nepo-messages {
          flex:1; overflow-y:auto; padding:16px 14px;
          max-height:360px; min-height:260px; scroll-behavior:smooth;
        }
        .nepo-messages::-webkit-scrollbar { width:4px; }
        .nepo-messages::-webkit-scrollbar-thumb { background:rgba(0,0,255,.15); border-radius:4px; }
        .nepo-skeleton {
          height:34px; border-radius:12px; margin-bottom:10px;
          background:linear-gradient(90deg,#f0f0f6 25%,#e4e4f0 50%,#f0f0f6 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite;
        }

        /* ── Notice bar (human / pending) ── */
        .nepo-notice {
          margin:0 14px 8px;
          border-radius:10px; padding:8px 12px;
          font-size:11.5px;
          display:flex; align-items:center; justify-content:space-between; gap:8px;
        }
        .nepo-notice-human {
          background:#f0fdf4; border:1px solid #86efac; color:#166534;
        }
        .nepo-notice-pending {
          background:#fffbeb; border:1px solid #fcd34d; color:#92400e;
        }
        .nepo-notice-left { display:flex; align-items:center; gap:6px; }

        /* ── Chat-with-admin button ── */
        .nepo-admin-bar {
          border-top: 1px solid rgba(122,122,254,.1);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nepo-admin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 999px;
          border: 1.5px solid rgba(0,0,255,.3);
          background: rgba(0,0,255,.04);
          color: #0000FF; font-family:'Sora',sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .2s;
          white-space: nowrap;
        }
        .nepo-admin-btn:hover:not(:disabled) {
          background: rgba(0,0,255,.09);
          border-color: #0000FF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,255,.12);
        }
        .nepo-admin-btn:disabled {
          opacity: .5; cursor: not-allowed; transform: none;
        }

        .nepo-input-area {
          border-top:1px solid rgba(122,122,254,.12);
          padding:10px 12px; display:flex; align-items:flex-end; gap:8px; flex-shrink:0;
        }
        .nepo-textarea {
          flex:1; border:1px solid rgba(122,122,254,.22);
          border-radius:14px; padding:9px 13px;
          font-family:'Sora',sans-serif; font-size:13px;
          color:#1a1a2e; background:#fafafa; resize:none;
          outline:none; max-height:90px; min-height:38px;
          line-height:1.5; transition:border-color .2s, box-shadow .2s;
          overflow-y:auto;
        }
        .nepo-textarea::placeholder { color:#aaa; }
        .nepo-textarea:focus {
          border-color:#0000FF; background:#fff;
          box-shadow:0 0 0 3px rgba(0,0,255,.08);
        }
        .nepo-send {
          width:38px; height:38px; border-radius:50%; border:none;
          background:linear-gradient(135deg,#0000FF,#4F60FF);
          color:#fff; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 12px rgba(0,0,255,.3);
          transition:opacity .2s, transform .15s;
        }
        .nepo-send:hover:not(:disabled) { opacity:.88; transform:scale(1.07); }
        .nepo-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }
      `}</style>

      <div className="nepo-chat-wrap">
        <div className="nepo-chat-box">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="nepo-chat-header">
            <div className="nepo-chat-avatar">
              {headerStatus.icon}
              <span
                className="nepo-online-dot"
                style={{
                  background: headerStatus.dot,
                  animation:
                    mode === "pending"
                      ? "pendingPulse 1.2s ease infinite"
                      : "none",
                }}
              />
            </div>
            <div className="nepo-hdr-info">
              <div className="nepo-hdr-name">Nepogames Support</div>
              <div className="nepo-hdr-status">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: headerStatus.dot,
                    flexShrink: 0,
                    animation:
                      mode === "pending"
                        ? "pendingPulse 1.2s ease infinite"
                        : "none",
                  }}
                />
                {headerStatus.label}
              </div>
            </div>
            <span className="nepo-mode-badge">{headerStatus.badge}</span>
            <button
              className="nepo-hdr-btn"
              onClick={() => setMinimized((p) => !p)}
            >
              {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button className="nepo-hdr-btn" onClick={onClose}>
              <X size={13} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* ── Messages ───────────────────────────────────────────── */}
              <div className="nepo-messages">
                {initializing ? (
                  <>
                    <div className="nepo-skeleton" style={{ width: "60%" }} />
                    <div
                      className="nepo-skeleton"
                      style={{ width: "75%", marginLeft: "auto" }}
                    />
                    <div className="nepo-skeleton" style={{ width: "65%" }} />
                  </>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <Bubble key={i} msg={msg} />
                    ))}
                    {loading && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#0000FF,#4F60FF)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Bot size={13} color="#fff" />
                        </div>
                        <TypingDots />
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* ── Status notice (human / pending) ────────────────────── */}
              {mode === "human" && (
                <div className="nepo-notice nepo-notice-human">
                  <div className="nepo-notice-left">
                    <UserCheck size={13} />
                    You're now chatting with a live support agent.
                  </div>
                </div>
              )}
              {mode === "pending" && (
                <div className="nepo-notice nepo-notice-pending">
                  <div className="nepo-notice-left">
                    <Clock
                      size={13}
                      style={{ animation: "pendingPulse 1.2s ease infinite" }}
                    />
                    Waiting for an agent to join…
                  </div>
                </div>
              )}

              {/* ── Chat with Admin button (bot mode only) ──────────────── */}
              {mode === "bot" && !initializing && (
                <div className="nepo-admin-bar">
                  <button
                    className="nepo-admin-btn"
                    onClick={requestHuman}
                    disabled={requestingHuman}
                  >
                    {requestingHuman ? (
                      <Loader2
                        size={12}
                        style={{ animation: "spinIt 1s linear infinite" }}
                      />
                    ) : (
                      <Headphones size={12} />
                    )}
                    {requestingHuman ? "Connecting…" : "Chat with Admin"}
                  </button>
                </div>
              )}

              {/* ── Input area ─────────────────────────────────────────── */}
              <div className="nepo-input-area">
                <textarea
                  ref={inputRef}
                  className="nepo-textarea"
                  placeholder={
                    mode === "pending"
                      ? "You can still type while you wait…"
                      : "Type your message…"
                  }
                  value={input}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading || initializing}
                />
                <button
                  className="nepo-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || initializing}
                >
                  {loading ? (
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
    </>
  );
}
