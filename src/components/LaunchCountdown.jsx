"use client";

import { useEffect, useState } from "react";

const LAUNCH_DATE = new Date("2026-07-01T00:00:00+01:00");

function getTimeLeft() {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    if (!getTimeLeft()) return;
    const interval = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&display=swap');

        .cd-wrap {
          font-family: 'Inter', sans-serif;
          padding: clamp(2rem, 8vw, 5rem) clamp(0.75rem, 4vw, 2rem);
          text-align: center;
          max-width: 860px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        .cd-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #eff4ff;
          color: #1b4dff;
          font-size: clamp(0.55rem, 2vw, 0.7rem);
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: clamp(4px, 1.5vw, 6px) clamp(10px, 3vw, 16px);
          border-radius: 999px;
          margin-bottom: clamp(1rem, 4vw, 1.75rem);
          border: 1px solid #c7d7fe;
          white-space: nowrap;
        }

        .cd-badge-dot {
          width: 6px;
          height: 6px;
          min-width: 6px;
          background: #1b4dff;
          border-radius: 50%;
          animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .cd-heading {
          font-size: clamp(1.5rem, 8vw, 3.25rem);
          font-weight: 900;
          color: #0d0d0d;
          letter-spacing: clamp(-1px, -0.04em, -2px);
          line-height: 1.05;
          margin: 0 0 clamp(0.6rem, 2vw, 1rem);
          word-break: break-word;
        }

        .cd-heading span {
          color: #1b4dff;
        }

        .cd-sub {
          font-size: clamp(0.78rem, 2.5vw, 0.9375rem);
          color: #888;
          font-weight: 400;
          line-height: 1.6;
          margin: 0 0 clamp(1.5rem, 5vw, 3rem);
          padding: 0 clamp(0px, 2vw, 1rem);
        }

        .cd-sub strong {
          color: #0d0d0d;
          font-weight: 700;
        }

        .cd-grid {
          display: inline-flex;
          align-items: center;
          gap: clamp(4px, 2vw, 12px);
          background: #f4f7ff;
          border: 1px solid #c7d7fe;
          border-radius: clamp(14px, 4vw, 24px);
          padding: clamp(10px, 3vw, 20px) clamp(10px, 4vw, 24px);
          max-width: 100%;
          box-sizing: border-box;
        }

        .cd-sep {
          display: flex;
          align-items: center;
          padding-bottom: clamp(16px, 4vw, 22px);
          font-size: clamp(1rem, 4vw, 1.75rem);
          font-weight: 900;
          color: #c7d7fe;
          line-height: 1;
          user-select: none;
          flex-shrink: 0;
        }

        .cd-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          flex: 1;
        }

        .cd-num {
          font-size: clamp(1.4rem, 7vw, 3rem);
          font-weight: 900;
          color: #1b4dff;
          letter-spacing: clamp(-1px, -0.05em, -3px);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .cd-lbl {
          font-size: clamp(0.45rem, 1.5vw, 0.625rem);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8ba4f9;
          margin-top: clamp(4px, 1.5vw, 8px);
          white-space: nowrap;
        }
      `}</style>

      <section className="cd-wrap">
        <div className="cd-badge">
          <span className="cd-badge-dot" />
          We launch on July 1
        </div>

        <h2 className="cd-heading">
          Something big is <span>coming</span>
        </h2>

        <p className="cd-sub">
          Nepogames officially opens its doors on{" "}
          <strong>July 1, 2026</strong>. Be ready.
        </p>

        <div className="cd-grid">
          {units.map(({ label, value }, i) => (
            <>
              <div className="cd-tile" key={label}>
                <span className="cd-num">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="cd-lbl">{label}</span>
              </div>
              {i < units.length - 1 && (
                <span className="cd-sep" key={`sep-${i}`}>:</span>
              )}
            </>
          ))}
        </div>
      </section>
    </>
  );
}