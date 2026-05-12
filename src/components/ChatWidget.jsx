"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Bot, Loader2, Minimize2, Maximize2, Headphones } from "lucide-react";

function getStoredSession() {
  try { return localStorage.getItem("nepo_chat_session"); } catch { return null; }
}
function storeSession(id) {
  try { localStorage.setItem("nepo_chat_session", id); } catch {}
}

function TypingDots() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "10px 14px", background: "#f1f1f5",
      borderRadius: "18px 18px 18px 4px", width: "fit-content",
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#0000FF",
          display: "inline-block",
          animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 10, animation: "bubbleIn .2s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg,#0000FF,#4F60FF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: 8, marginTop: 2,
          boxShadow: "0 2px 8px rgba(0,0,255,.25)",
        }}>
          <Bot size={13} color="#fff" strokeWidth={2} />
        </div>
      )}
      <div style={{
        maxWidth: "76%", padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "linear-gradient(135deg,#0000FF,#4f5fff)" : "#f1f1f5",
        color: isUser ? "#fff" : "#1a1a2e",
        fontSize: 13.5, lineHeight: 1.6,
        boxShadow: isUser ? "0 2px 10px rgba(0,0,255,.22)" : "0 1px 4px rgba(0,0,0,.07)",
      }}>
        <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
        <div style={{ fontSize: 10, marginTop: 3, opacity: .5, textAlign: "right" }}>
          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
  const [mode, setMode] = useState("bot");
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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
          setMessages([{
            role: "assistant",
            text: "Hey! 👋 I'm the Nepo Games support bot. I can help with account issues, trades, payments, and more.\n\nWhat can I help you with today?",
            created_at: new Date().toISOString(),
          }]);
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

  // Poll for new messages when in human mode (agent replied)
  useEffect(() => {
    if (!sessionId || mode !== "human" || !isOpen) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/history?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.messages?.length > messages.length) {
          setMessages(data.messages);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, mode, isOpen, messages.length]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    const userMsg = { role: "user", text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userMessage: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, {
          role: "assistant", text: data.reply,
          created_at: new Date().toISOString(),
        }]);
      }
      if (data.mode) setMode(data.mode);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Sorry, something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) return null;

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
          background:#22c55e; border:2px solid #2244ff;
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
        .nepo-human-notice {
          margin:0 14px 8px;
          background:#f0fdf4; border:1px solid #86efac;
          border-radius:10px; padding:7px 11px;
          font-size:11.5px; color:#166534;
          display:flex; align-items:center; gap:6px;
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

          {/* header */}
          <div className="nepo-chat-header">
            <div className="nepo-chat-avatar">
              {mode === "human" ? <Headphones size={17} /> : <Bot size={17} />}
              <span className="nepo-online-dot" />
            </div>
            <div className="nepo-hdr-info">
              <div className="nepo-hdr-name">Nepo Games Support</div>
              <div className="nepo-hdr-status">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                {mode === "human" ? "Connected to live agent" : "AI Assistant • Online"}
              </div>
            </div>
            <span className="nepo-mode-badge">
              {mode === "human" ? "🧑 Human" : "🤖 Bot"}
            </span>
            <button className="nepo-hdr-btn" onClick={() => setMinimized(p => !p)}>
              {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button className="nepo-hdr-btn" onClick={onClose}>
              <X size={13} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* messages */}
              <div className="nepo-messages">
                {initializing ? (
                  <>
                    <div className="nepo-skeleton" style={{ width: "60%" }} />
                    <div className="nepo-skeleton" style={{ width: "75%", marginLeft: "auto" }} />
                    <div className="nepo-skeleton" style={{ width: "65%" }} />
                  </>
                ) : (
                  <>
                    {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                    {loading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg,#0000FF,#4F60FF)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Bot size={13} color="#fff" />
                        </div>
                        <TypingDots />
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {mode === "human" && (
                <div className="nepo-human-notice">
                  <Headphones size={13} /> You're now chatting with a live support agent.
                </div>
              )}

              {/* input */}
              <div className="nepo-input-area">
                <textarea
                  ref={inputRef}
                  className="nepo-textarea"
                  placeholder="Type your message…"
                  value={input}
                  rows={1}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading || initializing}
                />
                <button
                  className="nepo-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || initializing}
                >
                  {loading
                    ? <Loader2 size={15} style={{ animation: "spinIt 1s linear infinite" }} />
                    : <Send size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}