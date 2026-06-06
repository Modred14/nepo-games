"use client";

import Link from "next/link";
import { useState } from "react";

const LAUNCH_DATE = new Date("2026-07-01T00:00:00+01:00");

export default function WaitlistOrMarketplace() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const isLaunched = Date.now() >= LAUNCH_DATE.getTime();

  if (isLaunched) {
    return (
      <div className="cta-buttons reveal reveal-delay-2">
        <Link href="/marketplace" className="btn-primary">
          Browse listings →
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Something went wrong. Try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      <style>{`
        .wl-form {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 480px;
          margin: 0 auto;
        }

        .wl-input {
          flex: 1;
          min-width: 200px;
          padding: 0.875rem 1.25rem;
          border-radius: 100px;
          border: 1px solid rgba(26,24,20,0.2);
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: 0.9375rem;
          font-weight: 400;
          color: #1a1814;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .wl-input::placeholder { color: #aaa; }
        .wl-input:focus { border-color: #1b4dff; }

        .wl-btn {
          background: #1b4dff;
          color: #fff;
          padding: 0.875rem 1.75rem;
          border-radius: 100px;
          font-size: 0.9375rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          transition: background 0.2s, transform 0.15s, opacity 0.2s;
          white-space: nowrap;
        }

        .wl-btn:hover:not(:disabled) { background: #1340e0; transform: translateY(-1px); }
        .wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .wl-error {
          margin-top: 0.75rem;
          font-size: 0.8125rem;
          color: #e63946;
          font-weight: 400;
        }

        .wl-note {
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: #aaa;
          font-weight: 300;
        }

        .wl-success {
          text-align: center;
          padding: 2rem;
          background: #f4f7ff;
          border: 1px solid #c7d7fe;
          border-radius: 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .wl-success-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

        .wl-success-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1a1814;
          margin-bottom: 0.4rem;
        }

        .wl-success-sub {
          font-size: 0.875rem;
          color: #777;
          font-weight: 300;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          .wl-form { flex-direction: column; align-items: stretch; }
          .wl-input { min-width: unset; border-radius: 12px; }
          .wl-btn { border-radius: 12px; }
        }
      `}</style>
      {status === "success" && (
        <div className="wl-success" style={{ marginTop: "1rem" }}>
          <span className="wl-success-icon">🎮</span>
          <p className="wl-success-title">You're on the list!</p>
          <p className="wl-success-sub">
            We'll email you the moment Nepo Games goes live on July 1.
          </p>
        </div>
      )}
      {status !== "success" && (
        <div className="reveal reveal-delay-2">
          <div className="wl-form">
            <input
              className="wl-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={status === "loading"}
            />
            <button
              className="wl-btn"
              onClick={handleSubmit}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Joining..." : "Join waitlist →"}
            </button>
          </div>
          {errorMsg && <p className="wl-error">{errorMsg}</p>}
          <p className="wl-note">
            🔒 No spam. We'll only email you when we launch.
          </p>
        </div>
      )}
    </>
  );
}
