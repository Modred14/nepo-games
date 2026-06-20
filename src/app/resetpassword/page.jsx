"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  ArrowLeft,
  Send,
  ExternalLink,
  HeadphonesIcon,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const getEmailLink = (email) => {
    if (email.includes("@gmail.com")) return "https://mail.google.com";
    if (email.includes("@yahoo.com")) return "https://mail.yahoo.com";
    if (email.includes("@outlook.com") || email.includes("@hotmail.com"))
      return "https://outlook.live.com/mail";
    return "mailto:";
  };

  const transitionTo = (nextStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 280);
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    setError("");

    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      transitionTo(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend.");
        return;
      }
      setCooldown(30);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleReset();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        .fp-root * { box-sizing: border-box; }

        .fp-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          display: flex;
        }

        /* ── LEFT PANEL ── */
        .fp-panel {
          width: 420px;
          flex-shrink: 0;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 44px;
          position: relative;
          overflow: hidden;
        }
        .fp-panel-orb1 {
          position: absolute;
          top: -100px; right: -100px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: rgba(99,102,241,0.16);
          filter: blur(50px);
          pointer-events: none;
        }
        .fp-panel-orb2 {
          position: absolute;
          bottom: 60px; left: -80px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(59,130,246,0.1);
          filter: blur(40px);
          pointer-events: none;
        }
        .fp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .fp-logo-mark {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          display: flex; align-items: center; justify-content: center;
        }
        .fp-logo-mark svg { color: #fff; }
        .fp-logo-text { color: #f8fafc; font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }

        .fp-panel-mid {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 24px;
          position: relative;
          z-index: 1;
        }
        .fp-panel-heading {
          color: #f8fafc;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.25;
        }
        .fp-panel-sub {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.7;
          margin-top: -10px;
        }
        .fp-steps { display: flex; flex-direction: column; gap: 18px; }
        .fp-step { display: flex; align-items: center; gap: 14px; }
        .fp-step-dot {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1.5px solid rgba(99,102,241,0.45);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #818cf8;
        }
        .fp-step-label { color: #cbd5e1; font-size: 13.5px; }

        .fp-panel-footer {
          color: #334155;
          font-size: 12px;
          position: relative;
          z-index: 1;
        }
        .fp-panel-footer a { color: #334155; text-decoration: none; }
        .fp-panel-footer a:hover { color: #475569; }

        /* ── RIGHT MAIN ── */
        .fp-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          background: #ffffff;
          min-height: 100vh;
        }
        .fp-card {
          width: 100%;
          max-width: 400px;
        }

        /* ── ANIMATIONS ── */
        .fp-enter {
          animation: fpSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .fp-exit {
          animation: fpSlideOut 0.28s cubic-bezier(0.4, 0, 1, 1) both;
        }
        @keyframes fpSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fpSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-14px); }
        }
        .fp-float {
          animation: fpFloat 3s ease-in-out infinite;
        }
        @keyframes fpFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes fpShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          80%       { transform: translateX(-3px); }
        }

        /* ── EYEBROW ── */
        .fp-eyebrow {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 18px;
        }
        .fp-eyebrow-line {
          width: 20px; height: 1.5px;
          background: #6366f1;
          border-radius: 2px;
        }
        .fp-eyebrow-text {
          font-size: 11px;
          font-weight: 500;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .fp-title {
          font-size: 24px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 6px;
        }
        .fp-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.65;
          margin-bottom: 28px;
        }

        /* ── FIELD ── */
        .fp-field { position: relative; margin-bottom: 20px; }
        .fp-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s;
          display: flex;
        }
        .fp-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 13px 14px 13px 44px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .fp-input::placeholder { color: #94a3b8; }
        .fp-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
          background: #ffffff;
        }
        .fp-input:focus ~ .fp-field-icon { color: #6366f1; }

        /* ── BUTTONS ── */
        .fp-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .fp-btn-primary {
          background: #4f46e5;
          color: #ffffff;
        }
        .fp-btn-primary:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,70,229,0.28);
        }
        .fp-btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }
        .fp-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .fp-btn-ghost {
          background: transparent;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          margin-top: 12px;
        }
        .fp-btn-ghost:hover {
          border-color: #cbd5e1;
          color: #0f172a;
          background: #f8fafc;
        }

        /* ── ERROR ── */
        .fp-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fpShake 0.4s ease;
        }

        /* ── DIVIDER ── */
        .fp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0;
        }
        .fp-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .fp-divider-text { font-size: 11px; color: #94a3b8; }

        /* ── BACK LINK ── */
        .fp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          margin-top: 20px;
          background: none;
          border: none;
          padding: 0;
          transition: color 0.2s;
        }
        .fp-back:hover { color: #0f172a; }

        /* ── SUCCESS SCREEN ── */
        .fp-success-icon {
          width: 58px; height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.08));
          border: 1px solid rgba(99,102,241,0.18);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .fp-email-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 13px;
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          margin: 6px 0 20px;
          word-break: break-all;
        }
        .fp-hint-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 13px 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .fp-hint-text {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.65;
        }

        /* ── RESEND ── */
        .fp-meta { font-size: 12.5px; color: #94a3b8; margin-top: 14px; text-align: center; }
        .fp-resend-link {
          color: #6366f1;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 12.5px;
          padding: 0;
          transition: opacity 0.2s;
        }
        .fp-resend-link:hover:not(:disabled) { opacity: 0.7; }
        .fp-resend-link:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── SPINNER ── */
        .fp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: fpSpin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes fpSpin { to { transform: rotate(360deg); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .fp-panel { display: none; }
          .fp-main { padding: 32px 20px; background: #f8fafc; min-height: 100vh; align-items: flex-start; padding-top: 60px; }
          .fp-card {
            background: #ffffff;
            border-radius: 16px;
            padding: 28px 24px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
          }
        }
        @media (max-width: 480px) {
          .fp-title { font-size: 20px; }
          .fp-main { padding: 20px 16px; padding-top: 48px; }
        }
      `}</style>

      <div className="fp-root">
        {/* ── LEFT PANEL ── */}
        <div className="fp-panel">
          <div className="fp-panel-orb1" />
          <div className="fp-panel-orb2" />

          <div className="fp-logo">
            <div className="fp-logo-mark">
              <img src="/logo.png" alt="" className="p-2" />
            </div>
            <span className="fp-logo-text">Nepo Games</span>
          </div>

          <div className="fp-panel-mid">
            <div>
              <div className="fp-panel-heading">
                Locked out?
                <br />
                We've got you.
              </div>
              <div className="fp-panel-sub pt-4">
                Recover access to your account in seconds — no phone call, no
                waiting.
              </div>
            </div>
            <div className="fp-steps">
              {[
                {
                  icon: <Mail size={13} />,
                  label: "Enter your registered email",
                },
                {
                  icon: <Send size={13} />,
                  label: "Receive a secure reset link",
                },
                {
                  icon: <ShieldCheck size={13} />,
                  label: "Set your new password",
                },
              ].map((s, i) => (
                <div className="fp-step" key={i}>
                  <div className="fp-step-dot">{s.icon}</div>
                  <span className="fp-step-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fp-panel-footer">
            © 2026 Nepo games
          </div>
        </div>

        {/* ── RIGHT MAIN ── */}
        <div className="fp-main">
          <div className="fp-card">
            {/* STEP 1 */}
            {step === 1 && (
              <div className={animating ? "fp-exit" : "fp-enter"}>
                <div className="fp-eyebrow">
                  <div className="fp-eyebrow-line" />
                  <span className="fp-eyebrow-text">Account recovery</span>
                </div>
                <div className="fp-title">Reset your password</div>
                <div className="fp-desc">
                  Enter the email address linked to your account and we'll send
                  you a secure reset link.
                </div>

                {error && (
                  <div className="fp-error">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <div className="fp-field">
                  <div className="fp-field-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    className="fp-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <button
                  className="fp-btn fp-btn-primary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="fp-spinner" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send reset link
                    </>
                  )}
                </button>

                <button
                  className="fp-back"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className={animating ? "fp-exit" : "fp-enter"}>
                <div className="fp-success-icon fp-float">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="2"
                      y="6"
                      width="24"
                      height="17"
                      rx="3"
                      stroke="#6366f1"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M3 8l11 8 11-8"
                      stroke="#6366f1"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="fp-eyebrow">
                  <div className="fp-eyebrow-line" />
                  <span className="fp-eyebrow-text">Link sent</span>
                </div>
                <div className="fp-title">Check your inbox</div>
                <div className="fp-desc">
                  We've sent a password reset link to:
                </div>

                <div className="fp-email-badge">
                  <Mail size={14} color="#6366f1" />
                  {email}
                </div>

                <div className="fp-hint-box">
                  <Info
                    size={15}
                    color="#6366f1"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span className="fp-hint-text">
                    The link expires in{" "}
                    <strong style={{ color: "#0f172a", fontWeight: 500 }}>
                      15 minutes
                    </strong>
                    . If it doesn't arrive, check your spam folder.
                  </span>
                </div>

                <a
                  href={getEmailLink(email)}
                  className="fp-btn fp-btn-primary"
                  style={{ textDecoration: "none" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={15} /> Open email app
                </a>

                <div className="fp-meta">
                  Didn't get it?{" "}
                  <button
                    className="fp-resend-link"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resendLoading}
                  >
                    {resendLoading
                      ? "Sending…"
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Resend link"}
                  </button>
                </div>

                <div className="fp-meta">
                  <button
                    className="fp-resend-link"
                    onClick={() => transitionTo(1)}
                  >
                    ← Use a different email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
