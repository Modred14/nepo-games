"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check,
  Plus,
  DollarSign,
  User2,
  ArrowRight,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ─── Tiny CSS-in-JS animation primitives ────────────────────────────────────
const fadeUp = {
  animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
};

const globalStyles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 0.7; }
    70%  { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.6); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  .step-card:hover { transform: translateY(-2px); }
  .step-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  html { scroll-behavior: smooth; }
`;

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        border: "2.5px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── OTP digit input ────────────────────────────────────────────────────────
function OtpInput({ otp, setOtp }) {
  const refs = useRef([]);

  const handleChange = (val, i) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setOtp(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        marginTop: 24,
      }}
    >
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          style={{
            width: 48,
            height: 56,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            border: digit ? "2px solid #0000FF" : "2px solid #e2e4f0",
            borderRadius: 12,
            outline: "none",
            background: digit ? "#f0f0ff" : "#fafafa",
            color: "#0000FF",
            transition: "border-color 0.2s, background 0.2s",
            boxShadow: digit ? "0 0 0 4px rgba(0,0,255,0.08)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Step tracker (left panel) ───────────────────────────────────────────────
const STEPS_META = [
  { icon: User2, label: "Create Profile", sub: "Set up your seller identity" },
  {
    icon: Shield,
    label: "Verify Email",
    sub: "Confirm your email to continue",
  },
  { icon: Plus, label: "List Your Games", sub: "Post accounts for sale" },
  {
    icon: DollarSign,
    label: "Earn Money",
    sub: "Get paid securely & instantly",
  },
];

function StepTracker({ active }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {STEPS_META.map((s, i) => {
        const Icon = s.icon;
        const done = i < active - 1;
        const current = i === active - 1;
        const isLast = i === STEPS_META.length - 1;

        return (
          <div
            key={i}
            style={{ display: "flex", gap: 16, position: "relative" }}
          >
            {/* Line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: done || current ? "#0000FF" : "#f0f0f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: current ? "0 0 0 6px rgba(0,0,255,0.12)" : "none",
                  transition: "all 0.3s ease",
                }}
                className="border border-gray-900/50"
              >
                {done ? (
                  <Check size={18} color="#fff" />
                ) : (
                  <Icon size={18} color={current ? "#fff" : "#aaa"} />
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 32,
                    background: done ? "#000000" : "#e8e8f4",
                    transition: "background 0.4s ease",
                    marginTop: 4,
                    marginBottom: 4,
                  }}
                />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingBottom: isLast ? 0 : 28, paddingTop: 0 }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: current ? "#ffffff" : done ? "#dbeafe" : "#dbeafe",
                  textDecoration: done && !current ? "line-through" : "none",
                  margin: 0,
                  transition: "color 0.3s",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  textDecoration: done && !current ? "line-through" : "none",
                  color: current ? "#ffffff" : done ? "#dbeafe" : "#dbeafe",
                  margin: "2px 0 0",
                }}
              >
                {s.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Left branding panel ────────────────────────────────────────────────────
function BrandPanel({ step }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, #0000FF 0%, #2929ff 50%, #0000cc 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }}
      />

      {/* Logo */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo.png" className="rounded-full p-2" />
          </div>
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.3px",
            }}
          >
            Nepogames
          </span>
        </div>

        <div style={{ marginTop: 48 }}>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Seller Onboarding
          </p>
          <h2
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
            }}
          >
            Start selling your
            <br />
            gaming accounts
          </h2>
          <p
            style={{
              color: "#fff",
              fontSize: 14,
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            Join thousands of sellers earning on Nigeria's premier gaming
            marketplace.
          </p>
        </div>

        <div style={{ marginTop: 48 }}>
          <StepTracker active={step} />
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {["256-bit SSL", "Instant Payout", "24/7 Support"].map((b) => (
          <div
            key={b}
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 11,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              backdropFilter: "blur(4px)",
            }}
          >
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Seller() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Auth guard + pull email from JWT ──────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }
        if (!res.ok) return;

        const user = await res.json();
        if (user.email_verified) {
          router.replace("/sell-game");
          return;
        }
        // Pre-fill email from JWT/session
        if (user.email) {
          setEmail(user.email);
          setMaskedEmail(maskEmail(user.email));
        }
      } catch {
        router.replace("/login");
      }
    };
    checkUser();
  }, [router]);

  // Resume OTP step if already sent
  useEffect(() => {
    const saved = sessionStorage.getItem("verify-email");
    if (saved) {
      setEmail(saved);
      setMaskedEmail(maskEmail(saved));
      setStep(3);
    }
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskEmail = (e) => {
    if (!e) return "";
    const [local, domain] = e.split("@");
    if (!domain) return e;
    const visible = local.slice(0, 2);
    const masked = "*".repeat(Math.max(local.length - 4, 3));
    const end = local.slice(-2);
    return `${visible}${masked}${end}@${domain}`;
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");
      sessionStorage.setItem("verify-email", email);
      setStep(3);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Verification failed");
      sessionStorage.removeItem("verify-email");
      await fetch("/api/seller/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await update({ user: { phone_verified: true } });
      setStep(4);
    } catch (err) {
      setError(err.message || "Invalid code");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared form card wrapper ───────────────────────────────────────────────
  const cardStyle = {
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 440,
    ...fadeUp,
  };

  const btnStyle = {
    width: "100%",
    height: 52,
    borderRadius: 14,
    background: loading ? "#3333ff" : "#0000FF",
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    transition: "background 0.2s, transform 0.15s",
    opacity: loading ? 0.8 : 1,
  };

  // ── STEP 1: Landing ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <>
        <style>{globalStyles}</style>
        <div
          style={{
            minHeight: "100vh",
            background: "#fafafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 960, ...fadeUp }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#eeeeff",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  color: "#0000FF",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  marginBottom: 16,
                }}
              >
                <Sparkles size={12} /> Seller Program
              </div>
              <h1
                style={{
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 800,
                  color: "#0a0a1a",
                  letterSpacing: "-1px",
                  margin: 0,
                }}
              >
                Become a Seller on Nepogames
              </h1>
              <p style={{ color: "#6b7280", marginTop: 12, fontSize: 16 }}>
                Turn your gaming accounts into income — fast, secure, and free
                to start.
              </p>
            </div>

            {/* Main card */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{
                background: "#fff",
                borderRadius: 24,
                border: "1px solid #eaebff",
                boxShadow: "0 8px 60px rgba(0,0,255,0.06)",
                overflow: "hidden",
              }}
            >
              {/* Left: steps */}
              <div
                style={{
                  padding: "48px 40px",
                  borderRight: "1px solid #f0f0fb",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#9ca3af",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    margin: "0 0 28px",
                  }}
                >
                  How it works
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {STEPS_META.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={i}
                        className="step-card"
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "flex-start",
                          padding: "14px 0",
                          borderBottom: i < 3 ? "1px solid #f4f4fb" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: "#eeeeff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={18} color="#0000FF" />
                        </div>
                        <div>
                          <p
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: "#111",
                              margin: 0,
                            }}
                          >
                            {s.label}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              margin: "3px 0 0",
                            }}
                          >
                            {s.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  style={{
                    ...btnStyle,
                    marginTop: 32,
                    borderRadius: 14,
                    fontSize: 15,
                    letterSpacing: "0.2px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-1px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Apply as a Seller <ArrowRight size={18} />
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "#9ca3af",
                    marginTop: 14,
                  }}
                >
                  Questions?{" "}
                  <Link
                    href="/contact"
                    style={{ color: "#0000FF", fontWeight: 500 }}
                  >
                    Contact support
                  </Link>
                </p>
              </div>

              {/* Right: illustration / stats */}
              <div
                className="hidden sm:flex"
                style={{
                  background: "linear-gradient(145deg, #0000FF, #2929ff)",

                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 40,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -60,
                    left: -40,
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                  }}
                />

                <img
                  src="/sell.png"
                  alt="Sell games"
                  style={{
                    width: "70%",
                    maxWidth: 220,
                    animation: "float 4s ease-in-out infinite",
                    position: "relative",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 32,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {[
                    ["2,400+", "Active Sellers"],
                    ["₦0", "Listing Fee"],
                    ["24h", "First Sale"],
                  ].map(([num, lbl]) => (
                    <div key={lbl} style={{ textAlign: "center" }}>
                      <p
                        style={{
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 22,
                          margin: 0,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {num}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 11,
                          margin: 0,
                        }}
                      >
                        {lbl}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── STEP 4: Success ────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <>
        <style>{globalStyles}</style>
        <div
          style={{
            minHeight: "100vh",
            background: "#fafafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              animation: "successPop 0.5s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#0a0a1a",
                margin: "0 0 8px",
                letterSpacing: "-0.5px",
              }}
            >
              You're a Seller!
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: 14,
                lineHeight: 1.6,
                margin: "0 auto",
                maxWidth: 320,
              }}
            >
              Your identity is verified. Welcome to the{" "}
              <span style={{ color: "#0000FF", fontWeight: 600 }}>
                Nepogames
              </span>{" "}
              marketplace — start listing and earning today.
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 28,
                justifyContent: "center",
              }}
            >
              <Link href="/marketplace">
                <button
                  style={{
                    padding: "11px 22px",
                    borderRadius: 12,
                    background: "#0000FF",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Marketplace
                </button>
              </Link>
              <Link href="/sell-game">
                <button
                  style={{
                    padding: "11px 22px",
                    borderRadius: 12,
                    background: "#f0f0ff",
                    color: "#0000FF",
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  List a Game
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── STEPS 2 & 3: Two-column layout ────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          minHeight: "100vh",
        }}
      >
        {/* Left brand panel — hidden on mobile via inline media won't work, but works in Next.js with Tailwind */}
        <div className="hidden lg:block">
          <BrandPanel step={step} />
        </div>

        {/* Right form panel */}
        <div
        className="min-w-screen lg:min-w-full"
          style={{
            background: "#fafafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 20px",
            minHeight: "100vh",
            
          }}
        >
          {step === 2 && (
            <div style={cardStyle} key="step2">
              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#eeeeff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Mail size={24} color="#0000FF" />
              </div>

              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0a0a1a",
                  margin: "0 0 6px",
                  letterSpacing: "-0.4px",
                }}
              >
                Verify your email
              </h1>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  margin: "0 0 24px",
                  lineHeight: 1.6,
                }}
              >
                We'll send a 6-digit code to confirm your identity. Your email
                is pre-filled from your account.
              </p>

              {/* Email display (read-only, from JWT) */}
              <div
                style={{
                  background: "#f4f4ff",
                  border: "1px solid #dddeff",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Mail size={16} color="#0000FF" />
                <span style={{ fontSize: 14, color: "#111", fontWeight: 500 }}>
                  {email || "Loading your email…"}
                </span>
              </div>

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 500,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                style={btnStyle}
                onClick={handleSendOtp}
                disabled={loading || !email}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#1a1aff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0000FF";
                }}
              >
                {loading ? (
                  <>
                    <Spinner /> Sending code…
                  </>
                ) : (
                  <>
                    Send verification code <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 16,
                }}
              >
                Wrong email?{" "}
                <Link
                  href="/contact"
                  style={{ color: "#0000FF", fontWeight: 500 }}
                >
                  Contact support
                </Link>
              </p>
            </div>
          )}

          {step === 3 && (
            <div style={cardStyle} key="step3">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "#eeeeff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  position: "relative",
                }}
              >
                <Shield size={24} color="#0000FF" />
                {/* Pulse ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: "2px solid #0000FF",
                    animation: "pulse-ring 2s ease-out infinite",
                    opacity: 0,
                  }}
                />
              </div>

              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0a0a1a",
                  margin: "0 0 6px",
                  letterSpacing: "-0.4px",
                }}
              >
                Enter verification code
              </h1>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                A 6-digit code was sent to{" "}
                <span style={{ color: "#0a0a1a", fontWeight: 600 }}>
                  {maskedEmail}
                </span>
              </p>

              <OtpInput otp={otp} setOtp={setOtp} />

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 500,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                style={{
                  ...btnStyle,
                  opacity: loading || otp.join("").length < 6 ? 0.6 : 1,
                  cursor: otp.join("").length < 6 ? "not-allowed" : "pointer",
                }}
                onClick={handleVerify}
                disabled={loading || otp.join("").length < 6}
              >
                {loading ? (
                  <>
                    <Spinner /> Verifying…
                  </>
                ) : (
                  "Confirm & Continue"
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>
                  Didn't receive it?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: resendCooldown > 0 ? "default" : "pointer",
                      color: resendCooldown > 0 ? "#9ca3af" : "#0000FF",
                      fontWeight: 600,
                      fontSize: 13,
                      padding: 0,
                    }}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend code"}
                  </button>
                </p>
                <button
                  onClick={() => {
                    setStep(2);
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: 12,
                    cursor: "pointer",
                    marginTop: 4,
                  }}
                >
                  ← Back to email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
