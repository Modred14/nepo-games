"use client";
import {
  Trophy,
  Users,
  Clock,
  Gamepad2,
  ChevronRight,
  Crown,
  Flame,
  Shield,
  Star,
  X,
  ArrowLeft,
  Zap,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  Lock,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Reveal from "../reveal"; // your existing Reveal component

// ─── Mock Data ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0D0D1A",
        border: "1px solid rgba(122,122,254,0.15)",
      }}
    >
      <div className="h-1 w-full skel-bar" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl skel" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 rounded-full skel" />
              <div className="h-2.5 w-24 rounded-full skel" />
            </div>
          </div>
          <div className="h-6 w-16 rounded-full skel" />
        </div>
        <div className="h-5 w-3/4 rounded-full skel" />
        <div className="flex justify-between">
          <div className="space-y-1.5">
            <div className="h-2 w-14 rounded-full skel" />
            <div className="h-6 w-24 rounded-full skel" />
          </div>
          <div className="space-y-1.5 flex flex-col items-end">
            <div className="h-2 w-10 rounded-full skel" />
            <div className="h-4 w-20 rounded-full skel" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-2.5 w-20 rounded-full skel" />
            <div className="h-2.5 w-12 rounded-full skel" />
          </div>
          <div className="h-1.5 w-full rounded-full skel" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 rounded-full skel" />
          <div className="h-7 w-24 rounded-full skel" />
        </div>
      </div>
    </div>
  );
}

function TournamentSkeleton() {
  return (
    <div
      style={{ minHeight: "100vh", background: "#080812" }}
      className="tournament"
    >
      <style>{`
        .skel {
          background: linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.05) 75%);
          background-size: 800px 100%;
          animation: sk 1.4s infinite linear;
        }
        .skel-bar {
          background: linear-gradient(90deg,rgba(79,140,255,0.15) 25%,rgba(138,56,245,0.28) 50%,rgba(79,140,255,0.15) 75%);
          background-size: 800px 100%;
          animation: sk 1.4s infinite linear;
        }
        @keyframes sk { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
      `}</style>

      {/* Hero */}
      <div
        className="pt-32 pb-10 px-[5%]"
        style={{
          background: "linear-gradient(180deg,#0A0A1F 0%,#080812 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-5">
          <div className="h-7 w-40 rounded-full skel" />
          <div className="h-14 w-96 max-w-full rounded-2xl skel" />
          <div className="h-5 w-72 rounded-full skel" />
          <div className="grid grid-cols-3 gap-4 max-w-lg w-full mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-4 flex flex-col items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="h-5 w-5 rounded-full skel" />
                <div className="h-7 w-10 rounded-lg skel" />
                <div className="h-3 w-14 rounded-full skel" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="px-[5%] py-3"
        style={{
          background: "rgba(8,8,18,0.90)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex gap-2">
          {[120, 90, 100, 80].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-full skel shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="px-[5%] py-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full skel" />
          <div className="h-5 w-28 rounded-full skel" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "live")
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        LIVE
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
        <Clock size={10} />
        UPCOMING
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
      <Lock size={10} />
      CLOSED
    </span>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
function LeaderRow({ entry, isFF }) {
  const icons = {
    up: <span className="text-green-400 text-xs">▲</span>,
    down: <span className="text-red-400 text-xs">▼</span>,
    same: <span className="text-gray-500 text-xs">—</span>,
  };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
      ${entry.rank === 1 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-white/5 border border-white/5"}`}
    >
      <span className="w-7 text-center font-bold text-white/80">
        {medals[entry.rank] || `#${entry.rank}`}
      </span>
      <span className="flex-1 font-semibold text-white">{entry.team}</span>
      {icons[entry.change]}
      {isFF && (
        <span className="text-orange-400 text-xs w-14 text-right">
          {entry.kills}💀
        </span>
      )}
      <span className="text-white font-bold w-14 text-right">
        {entry.points} pts
      </span>
    </div>
  );
}

// ─── Tournament Detail Modal ──────────────────────────────────────────────────
function TournamentModal({ tournament: t, user, onClose }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const canJoin = t.status !== "closed" && t.slotsLeft > 0;

  useEffect(() => {
    if (!user?.email || !t.leaderboard) return;
    const alreadyIn = t.contestants?.some((c) => c.email === user.email);
    if (alreadyIn) setJoined(true);
  }, [user, t]);
  const handleJoin = async () => {
    setJoinError("");
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("tournament_return_url", currentPath);
      window.location.href = "/login";
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: t.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || "Something went wrong");
        return;
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error(err);
      setJoinError("Failed to initialize payment");
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const tabs = ["overview", "leaderboard", "rules"];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "#0D0D1A",
          border: "1px solid rgba(122,122,254,0.25)",
        }}
      >
        {/* Header band */}
        <div
          className="sticky top-0 z-10 px-5 pt-5 pb-4"
          style={{
            background: `linear-gradient(135deg, ${t.color}22, #0D0D1A)`,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl  flex items-center justify-center overflow-hidden"
                style={{
                  background: t.color + "22",
                  border: `1px solid ${t.color}44`,
                }}
              >
                <Image
                  src={t.logo}
                  alt={t.game}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-white/50 text-xs">{t.game}</p>
                <p className="text-white font-bold text-lg leading-tight">
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={t.status} />
                  <span className="text-white/40 text-xs">{t.format}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition mt-1"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-white/5 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-24 pt-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: <Trophy size={16} />,
                    label: "Prize Pool",
                    val: t.prize,
                    color: "#F7C948",
                  },
                  {
                    icon: <DollarSign size={16} />,
                    label: "Entry Fee",
                    val: t.entryFee,
                    color: "#4CAF50",
                  },
                  {
                    icon: <CalendarDays size={16} />,
                    label: "Date",
                    val: t.startDate,
                    color: "#4F8CFF",
                  },
                  {
                    icon: <Clock size={16} />,
                    label: "Time",
                    val: t.startTime,
                    color: "#8A38F5",
                  },
                  {
                    icon: <Users size={16} />,
                    label: "Slots Left",
                    val:
                      t.slotsLeft > 0 ? `${t.slotsLeft} / ${t.slots}` : "Full",
                    color:
                      t.slotsLeft <= 5 && t.slotsLeft > 0
                        ? "#FF6B2C"
                        : "#4F8CFF",
                  },
                  {
                    icon: <Shield size={16} />,
                    label: "Region",
                    val: t.region,
                    color: "#00C6FF",
                  },
                ].map(({ icon, label, val, color }, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 bg-white/5 border border-white/8 flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: color + "22", color }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">{label}</p>
                      <p className="text-white font-semibold text-sm">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="rounded-xl p-4 bg-white/5 border border-white/8">
                <p className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider">
                  About
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Slots bar */}
              {t.status !== "closed" && (
                <div className="rounded-xl p-4 bg-white/5 border border-white/8">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">Registration Progress</span>
                    <span className="text-white font-bold">
                      {t.slots - t.slotsLeft}/{t.slots} slots filled
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${((t.slots - t.slotsLeft) / t.slots) * 100}%`,
                        background: `linear-gradient(to right, ${t.color}, ${t.accent})`,
                      }}
                    />
                  </div>
                  {t.slotsLeft <= 10 && t.slotsLeft > 0 && (
                    <p className="text-orange-400 text-xs mt-2 flex items-center gap-1">
                      <Flame size={11} /> Only {t.slotsLeft} spots left —
                      filling fast!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="space-y-2">
              {t.leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/30">
                  <Trophy size={36} className="mb-3 opacity-30" />
                  <p className="text-sm">
                    Leaderboard will go live when tournament starts
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between px-4 text-[10px] text-white/30 uppercase tracking-wider mb-1">
                    <span>Rank · Team</span>
                    <span>Points</span>
                  </div>
                  {t.leaderboard.map((entry) => (
                    <LeaderRow
                      key={entry.rank}
                      entry={entry}
                      isFF={t.game === "Free Fire"}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-3">
              {t.rules.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-10">
                  Rules not yet published.
                </p>
              ) : (
                t.rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-green-400 mt-0.5 shrink-0"
                    />
                    <p className="text-white/80 text-sm">{rule}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div
          className="sticky bottom-0 px-5 py-4"
          style={{
            background: "linear-gradient(to top, #0D0D1A 80%, transparent)",
          }}
        >
          {canJoin ? (
            joined ? (
              <div className="w-full py-4 rounded-2xl text-center bg-green-500/20 border border-green-500/30 text-green-400 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                You're registered!
              </div>
            ) : (
              <div>
                {joinError && (
                  <p className="text-red-400 text-xs text-center mb-2 flex items-center justify-center gap-1">
                    <X size={12} /> {joinError}
                  </p>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${t.color}, ${t.accent})`,
                    boxShadow: `0 8px 24px ${t.color}44`,
                  }}
                >
                  {joining
                    ? "Redirecting to payment..."
                    : user
                      ? `Join Tournament ${t.entryFee !== "Free" ? `· ${t.entryFee}` : "· Free Entry"}`
                      : "Sign In to Join"}
                </button>
              </div>
            )
          ) : (
            <div
              className="w-full py-4 rounded-2xl text-center font-bold text-white/40 border border-white/10 flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Lock size={16} />
              {t.status === "closed"
                ? "Tournament Closed"
                : "No Slots Available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({ t, onClick }) {
  const fillPct = ((t.slots - t.slotsLeft) / t.slots) * 100;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-98"
      style={{
        background: "#0D0D1A",
        border: "1px solid rgba(122,122,254,0.2)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${t.color}, ${t.accent})`,
        }}
      />

      <div className="p-5">
        {/* Game + Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                background: t.color + "15",
                border: `1px solid ${t.color}30`,
              }}
            >
              <Image
                src={t.logo}
                alt={t.game}
                width={32}
                height={32}
                className="object-contain h-40 w-40"
              />
            </div>
            <div>
              <p className="text-white/40 text-[10px] leading-none mb-0.5">
                {t.game}
              </p>
              <p className="text-white/70 text-xs">{t.format}</p>
            </div>
          </div>
          <StatusBadge status={t.status} />
        </div>

        {/* Title */}
        <p className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-blue-300 transition-colors">
          {t.title}
        </p>

        {/* Prize + Date */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">
              Prize Pool
            </p>
            <p className="font-bold text-xl" style={{ color: t.color }}>
              {t.prize}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[10px] uppercase tracking-wider">
              Date
            </p>
            <p className="text-white/70 text-sm font-medium">{t.startDate}</p>
          </div>
        </div>

        {/* Slots bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>
              {t.slotsLeft > 0 ? `${t.slotsLeft} slots left` : "Full"}
            </span>
            <span>
              {t.slots - t.slotsLeft}/{t.slots}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${fillPct}%`,
                background: `linear-gradient(to right, ${t.color}, ${t.accent})`,
              }}
            />
          </div>
          {t.slotsLeft > 0 && t.slotsLeft <= 10 && (
            <p className="text-orange-400 text-xs mt-1.5 flex items-center gap-1">
              <Flame size={10} /> Filling fast!
            </p>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <DollarSign size={11} /> Entry: {t.entryFee}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all group-hover:gap-2"
            style={{ color: t.color, background: t.color + "15" }}
          >
            View Details <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TournamentPage() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [refOpen, setRefOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await fetch("/api/tournaments");
        const data = await res.json();
        setTournaments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);
  const ref = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }

        // ❌ Other errors (500, 404, etc)
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return; // stay on page
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        // 🌐 Network error lands here
        console.error("Network error:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setRefOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered =
    filter === "all"
      ? tournaments
      : tournaments.filter((t) => t.status === filter);

  const liveTournaments = tournaments.filter((t) => t.status === "live");
  const upcomingCount = tournaments.filter(
    (t) => t.status === "upcoming",
  ).length;
  const totalPrize = tournaments.reduce(
    (s, t) => s + (t.status !== "closed" ? t.prizeRaw : 0),
    0,
  );

  const filters = [
    { key: "all", label: "All Tournaments" },
    { key: "live", label: "🔴 Live Now" },
    { key: "upcoming", label: "⏳ Upcoming" },
    { key: "closed", label: "🔒 Closed" },
  ];
  if (loading) return <TournamentSkeleton />;

  return (
    <div
      style={{ minHeight: "100vh", background: "#080812" }}
      className="tournament"
    >
      {/* ── Navbar (matches your existing header style) ── */}

      {/* ── Hero ── */}
      <div
        className="pt-32 pb-10 px-[5%]"
        style={{
          background: "linear-gradient(180deg, #0A0A1F 0%, #080812 100%)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 w-[250px] sm:w-[600px] h-[200px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, #4F8CFF 0%, #8A38F5 60%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold"
              style={{
                background: "rgba(79,140,255,0.1)",
                borderColor: "rgba(79,140,255,0.3)",
                color: "#4F8CFF",
              }}
            >
              <Trophy size={12} />
              Competitive Gaming
            </div>
          </div>
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Active{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F8CFF, #8A38F5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tournaments
            </span>
          </h1>
          <p className="text-center text-white/50 max-w-md mx-auto mb-10 text-lg">
            Compete, win prizes, and rise to the top of the leaderboards.
          </p>

          {/* Stats strip */}
          <div className="sm:grid flex flex-wrap justify-center sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
            {[
              {
                icon: <Flame size={18} className="text-red-400" />,
                val: liveTournaments.length,
                label: "Live Now",
              },
              {
                icon: <Clock size={18} className="text-blue-400" />,
                val: upcomingCount,
                label: "Upcoming",
              },
              {
                icon: <Trophy size={18} className="text-yellow-400" />,
                val:
                  totalPrize >= 1_000_000_000_000
                    ? `₦ ${(totalPrize / 1_000_000_000_000).toFixed(1)}T+`
                    : totalPrize >= 1_000_000_000
                      ? `₦ ${(totalPrize / 1_000_000_000).toFixed(1)}B+`
                      : totalPrize >= 1_000_000
                        ? `₦ ${(totalPrize / 1_000_000).toFixed(1)}M+`
                        : `₦ ${(totalPrize / 1_000).toFixed(0)}k+`,
                label: "In Prizes",
              },
            ].map(({ icon, val, label }, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-white font-black text-2xl">{val}</p>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="sticky top-0 z-50 px-[5%] py-3"
        style={{
          background: "rgba(8,8,18,0.90)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === key
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={
                filter === key
                  ? {
                      background: "linear-gradient(135deg, #4F8CFF, #8A38F5)",
                    }
                  : {
                      background: "rgba(255,255,255,0.06)",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="px-[5%] py-10 max-w-7xl mx-auto">
        {/* Live section highlight */}
        {filter === "all" && liveTournaments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-white font-bold text-lg">Live Right Now</p>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {liveTournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  t={t}
                  onClick={() => setSelected(t)}
                />
              ))}
            </div>
            <div className="h-px my-8 bg-white/10" />
            <p className="text-white/50 font-semibold text-lg mb-4">
              Other Tournaments
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {(filter === "all"
            ? tournaments.filter((t) => t.status !== "live")
            : filtered
          ).map((t) => (
            <TournamentCard key={t.id} t={t} onClick={() => setSelected(t)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-white/20">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No tournaments in this category yet.</p>
          </div>
        )}
      </div>

      {/* ── CTA Banner ── */}
      <div className="px-[5%] pb-12 max-w-7xl mx-auto">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          style={{
            background: "rgba(79,140,255,0.08)",
            border: "1px solid rgba(122,122,254,0.2)",
          }}
        >
          <p className="text-white/60 text-sm">
            Want to host a tournament?{" "}
            <span className="text-white/80 font-medium">
              Reach thousands of players.
            </span>
          </p>
          <Link
            href="/contact"
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #4F8CFF, #8A38F5)" }}
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && (
        <TournamentModal
          tournament={selected}
          user={user}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Scrollbar hide */}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
