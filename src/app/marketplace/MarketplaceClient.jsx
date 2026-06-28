"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Reveal from "../reveal";
import {
  Search,
  ShoppingCart,
  Verified,
  MessageCircle,
  Bell,
  User,
  Menu,
  Home,
  X,
} from "lucide-react";
import Image from "next/image";
import NoGame from "@/components/NoGame";
import ReactSlider from "react-slider";
import SmallLoader from "@/components/smallLoader";
import { signOut } from "next-auth/react";
import Loader from "@/components/Loader";
import DashboardStats from "@/lib/seller-data";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Sidebar internals ───────────────────────────────────────────────────────
import { useState as useLocalState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Heart,
  Bookmark,
  BarChart2,
  Settings,
  Zap,
  TrendingUp,
  Package,
  Wallet,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Lock,
  Clock,
  Eye,
  EyeOff,
  Tag,
  ArrowDownToLine,
  PlusCircle,
  Circle,
} from "lucide-react";
import { usePathname } from "next/navigation";

// ── BalanceCard ───────────────────────────────────────────────────────────────
function BalanceCard() {
  const [visible, setVisible] = useState(false);
  const [balance, setBalance] = useState(0.0);
  const mask = (v) => (visible ? v : "₦ ••••••");
  const fetchAccount = async () => {
    try {
      const res = await fetch("/api/user/account");

      if (!res.ok) {
        console.error("Failed to load account");
        return;
      }

      const data = await res.json();

      setBalance(Number(data.balance || 0));
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="mx-1 rounded-xl overflow-hidden bg-gradient-to-br from-[#0047FF]/10 via-[#0025A0]/05 to-transparent border border-[#0047FF]/20 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-[#0047FF]" />
          <span className="text-gray-500 text-xs font-medium">
            Account Overview
          </span>
        </div>
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {visible ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      <div className="space-y-2.5 mb-4">
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">
            Available
          </p>
          <p className="text-gray-900 font-bold text-lg">
            {mask(`₦ ${balance.toFixed(2)}`)}
          </p>
        </div>
      </div>
      <Link href="/profile?tab=account">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0047FF] hover:bg-[#0040EE] text-white text-xs font-semibold transition-colors"
        >
          <Plus size={13} /> Add Funds
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ── QuickActions ──────────────────────────────────────────────────────────────
function QuickActions() {
  const ACTIONS = [
    {
      icon: Tag,
      label: "Sell Account",
      href: "/sell-game",
      color: "text-emerald-600",
      bg: "bg-emerald-50 hover:bg-emerald-100",
    },
    {
      icon: ArrowDownToLine,
      label: "Withdraw",
      href: "/withdraw",
      color: "text-amber-600",
      bg: "bg-amber-50 hover:bg-amber-100",
    },
    {
      icon: PlusCircle,
      label: "New Listing",
      href: "/sell-game",
      color: "text-[#0047FF]",
      bg: "bg-blue-50 hover:bg-blue-100",
    },
  ];
  return (
    <div className="px-1 mb-1">
      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
        Quick Actions
      </p>
      <div className="flex flex-col gap-1.5">
        {ACTIONS.map((action, i) => (
          <Link key={i} href={action.href}>
            <motion.div
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${action.bg}`}
            >
              <action.icon size={15} className={action.color} />
              <span className="text-gray-700 text-sm font-medium">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: Home, label: "Homepage", href: "/" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: User, label: "Profile", href: "/profile?tab=profile" },
  {
    icon: MessageCircle,
    label: "Messages",
    href: "/c/1?receiver_id=1&from=marketplace",
  },

  { icon: Settings, label: "Settings", href: "/profile?tab=password" },
];

const QUICK_STATS = [
  { label: "Bought", value: "24", icon: ShoppingBag, color: "text-blue-500" },
  { label: "Sold", value: "12", icon: TrendingUp, color: "text-emerald-500" },
  { label: "Listed", value: "5", icon: Package, color: "text-violet-500" },
];

const RECENT_ACTIVITY = [
  { label: "Efootball account sold", time: "2m ago", dot: "bg-emerald-400" },
  { label: "New message from Kemi", time: "15m ago", dot: "bg-blue-400" },
  { label: "COD account purchased", time: "1h ago", dot: "bg-violet-400" },
];

function Sidebar({ user, unread, onLogout }) {
  const pathname = usePathname();
  const hasPlan = user?.plan && user.plan !== "free";

  return (
    <motion.aside
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-[280px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-gray-200 overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4.25 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-[#0047FF] flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Nepogames"
            height={32}
            width={32}
            className="w-8 h-8 p-2 rounded-lg bg-[#0047FF] object-cover"
            priority
          />
        </div>
        <span className="text-gray-900 font-semibold tracking-wide">
          Nepogames
        </span>
      </div>

      <div className="flex flex-col gap-1 px-3 py-4 flex-1">
        {/* Profile */}
        <Link href="/profile">
          <motion.div
            whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-2"
          >
            <div className="relative shrink-0">
              <img
                src={
                  user?.profile_image ||
                  "https://ui-avatars.com/api/?name=" +
                    (user?.username || "U") +
                    "&background=0047FF&color=fff"
                }
                alt={user?.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0047FF]/40"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-gray-900 text-sm font-semibold truncate">
                  {user?.username || "Guest"}
                </p>
                {hasPlan && (
                  <Verified
                    className="fill-[#0047FF] text-white shrink-0"
                    size={13}
                  />
                )}
              </div>
              <p className="text-emerald-500 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{" "}
                Online
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          </motion.div>
        </Link>

        <BalanceCard />

        <div className="h-px bg-gray-200 my-3 mx-1" />

        {/* Nav */}
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">
          Navigation
        </p>
        <nav className="flex flex-col gap-0.5 mb-5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative ${
                    active
                      ? "bg-[#0047FF]/10 text-[#0047FF]"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <item.icon
                    size={16}
                    className={active ? "text-[#0047FF]" : ""}
                  />
                  <span className="text-sm font-medium flex-1">
                    {item.label}
                  </span>
                  {item.label === "Messages" && unread > 0 && (
                    <span className="text-[10px] bg-[#0047FF] text-white rounded-full px-1.5 py-0.5 font-semibold">
                      {unread}
                    </span>
                  )}
                  {item.badge && item.label !== "Messages" && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute right-2 w-1 h-4 bg-[#0047FF] rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* <div className="h-px bg-gray-200 my-3 mx-1" />

       
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Quick Stats
        </p>
        <div className="grid grid-cols-3 gap-2 px-1 mb-3">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center"
            >
              <stat.icon size={14} className={`${stat.color} mx-auto mb-1`} />
              <p className="text-gray-900 font-bold text-sm">{stat.value}</p>
              <p className="text-gray-400 text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>

        <QuickActions /> */}

        {/* <div className="h-px bg-gray-200 my-3 mx-1" />

       
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Recent Activity
        </p>
        <div className="flex flex-col gap-1 px-1 mb-4">
          {RECENT_ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`}
              />
              <p className="text-gray-600 text-xs truncate flex-1">
                {item.label}
              </p>
              <span className="text-gray-400 text-[10px] shrink-0">
                {item.time}
              </span>
            </div>
          ))}
        </div> */}

        {/* Upgrade */}
        {!hasPlan && (
          <Link href="/pricing">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mx-1 p-4 rounded-xl bg-gradient-to-br from-[#0047FF]/10 to-[#0025A0]/05 border border-[#0047FF]/20 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap size={14} className="text-[#0047FF]" />
                <p className="text-gray-900 text-xs font-semibold">
                  Go Premium
                </p>
              </div>
              <p className="text-gray-500 text-[11px] mb-3 leading-relaxed">
                Verified badge, priority listings & analytics.
              </p>
              <div className="flex items-center gap-1 text-[#0047FF] text-xs font-semibold">
                Upgrade now <ArrowUpRight size={12} />
              </div>
            </motion.div>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}

// ─── Main Marketplace Component ───────────────────────────────────────────────
export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [load, setLoad] = useState(true);
  const [platform, setPlatform] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [type, setType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const ref = useRef(null);
  const [unread, setUnread] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/user/unread");
        if (!res.ok) throw new Error("Failed to fetch unread count");
        const data = await res.json();
        setUnread(data.unread || 0);
      } catch (err) {
        console.error("Unread fetch error:", err);
        setUnread(0);
      }
    };
    fetchUnread();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setLoad(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  const isSeller = user?.phone_verified;
  const hasPlan = user?.plan && user.plan !== "free";

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) throw new Error("Failed to fetch listings");
        const data = await res.json();
        setGames(data.games);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("nepo-user");
    await signOut({ callbackUrl: "/login" });
  };

  function formatGamePrice(price) {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    return `₦ ${numericPrice.toLocaleString()}`;
  }

  const getAmount = (price) => parseFloat(price.replace(/[^0-9.]/g, ""));

  const filteredGames = games
    .filter((game) => {
      const matchesSearch = game.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPlatform = !platform || game.platform === platform;
      const matchesGame = !type || game.title === type;
      const matchesVerified = !verifiedOnly || game.verified === true;
      const amount = getAmount(game.price);
      return (
        matchesSearch &&
        matchesPlatform &&
        matchesGame &&
        matchesVerified &&
        amount >= priceRange[0] &&
        amount <= priceRange[1]
      );
    })
    .sort((a, b) => b.verified - a.verified);

  const isImagesReady =
    filteredGames.length === 0 || imagesLoaded >= filteredGames.length;

  useEffect(() => {
    let count = 0;
    if (filteredGames.length === 0) return;
    filteredGames.forEach((game) => {
      const img = new window.Image();
      img.src = game.cover_image;
      img.onload = img.onerror = () => {
        count++;
        if (count === filteredGames.length)
          setImagesLoaded(filteredGames.length);
      };
    });
  }, [filteredGames]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, []);

  if (load) return <MarketplaceSkeleton />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Logout modal */}
      <AnimatePresence>
        {logOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-[90%] max-w-sm rounded-2xl bg-white border border-gray-200 p-6 shadow-2xl"
            >
              <h2 className="text-gray-900 text-base font-semibold mb-1">
                Confirm logout
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Are you sure you want to log out of this device?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setLogOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 text-sm rounded-xl bg-red-500/90 hover:bg-red-500 text-white transition font-medium"
                >
                  Yes, log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          user={user}
          unread={unread}
          onLogout={() => setLogOpen(true)}
        />
      </div>
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar
                user={user}
                unread={unread}
                onLogout={() => {
                  setDrawerOpen(false);
                  setLogOpen(true);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>{" "}
            {/* <div className="lg:hidden w-8 h-8 rounded-lg bg-[#0047FF] flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Nepogames"
                height={32}
                width={32}
                className="w-8 h-8 p-2 rounded-lg bg-[#0047FF] object-cover"
                priority
              />
            </div> */}
            <div>
              {/* <p className="text-gray-900 font-semibold text-sm">Marketplace</p>
              <p className="text-gray-400 text-xs hidden lg:block">
                Browse & buy gaming accounts
              </p> */}
              <div>
                <p className="text-gray-900 font-semibold">
                  Hi, {user?.username || user?.first_name || "there"} 👋
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:flex">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-xl pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-[#0047FF]/50 focus:bg-white transition"
                placeholder="Search accounts…"
              />
            </div>

            {!isSeller ? (
              <Link href="/seller">
                <button className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#0047FF] hover:bg-[#0040EE] text-white text-xs font-semibold rounded-xl transition">
                  <Plus size={13} /> Become Seller
                </button>
              </Link>
            ) : !hasPlan ? (
              <Link href="/pricing">
                <button className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#0047FF] hover:bg-[#0040EE] text-white text-xs font-semibold rounded-xl transition">
                  <Verified size={13} /> Get Verified
                </button>
              </Link>
            ) : null}

            {/* Notification */}
            <Link href="/c/1?receiver_id=1&from=marketplace">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition"
              >
                <MessageCircle size={16} />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center"
                  >
                    {unread}
                  </motion.span>
                )}
              </motion.button>
            </Link>

            {/* Avatar + dropdown */}
            <div
              ref={ref}
              className="relative"
              onMouseEnter={() => {
                setOpen(true);
                setLogOpen(false);
              }}
            >
              <div
                className="relative cursor-pointer"
                onClick={() => setOpen(true)}
              >
                <img
                  src={
                    user?.profile_image ||
                    `https://ui-avatars.com/api/?name=${user?.username || "U"}&background=0047FF&color=fff`
                  }
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover  ring ring-[#0047FF]/40"
                />
                {hasPlan && (
                  <Verified
                    className="fill-emerald-500 absolute -bottom-1 -right-1 text-white"
                    size={14}
                  />
                )}
              </div>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs transition"
                    >
                      <span>👤</span> Profile
                    </Link>
                    {!isSeller ? (
                      <Link
                        href="/seller"
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs transition border-t border-gray-100"
                      >
                        <span>📦</span> Become Seller
                      </Link>
                    ) : !hasPlan ? (
                      <Link
                        href="/pricing"
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs transition border-t border-gray-100"
                      >
                        <span>✅</span> Get Verified
                      </Link>
                    ) : null}
                    {isSeller && (
                      <Link
                        href="/sell-game"
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs transition border-t border-gray-100"
                      >
                        <span>💰</span> Sell Account
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        setLogOpen(true);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 text-xs transition border-t border-gray-100 cursor-pointer"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 px-4 lg:px-6 py-5">
          {/* Mobile search */}
          <div className="flex lg:hidden items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-xl pl-9 pr-4 py-2.5 w-full focus:outline-none focus:border-[#0047FF]/50 transition"
                placeholder="Search accounts…"
              />
            </div>
            {!isSeller ? (
              <Link href="/seller">
                <button className="flex items-center gap-1 px-3 py-2.5 bg-[#0047FF] text-white text-xs font-semibold rounded-xl whitespace-nowrap">
                  Become Seller
                </button>
              </Link>
            ) : !hasPlan ? (
              <Link href="/pricing">
                <button className="flex items-center gap-1 px-3 py-2.5 bg-[#0047FF] text-white text-xs font-semibold rounded-xl whitespace-nowrap">
                  Get Verified
                </button>
              </Link>
            ) : null}
          </div>

          {/* Filter bar */}
          <motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1, duration: 0.4 }}
  className="bg-white border border-gray-200 rounded-2xl mb-5 overflow-hidden"
>
  {/* Filter bar header */}
  {/* <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
    <i className="ti ti-adjustments-horizontal text-sm text-gray-400" aria-hidden="true" />
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Filters</span>
  </div> */}

  <div className="flex flex-wrap items-end gap-4 p-4">
    {/* Game */}
    <div className="flex flex-col gap-1.5 flex-1 min-w-36">
      <label className="text-gray-400 text-[10.5px] font-semibold uppercase tracking-widest">
        Game
      </label>
      <div className="relative">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
     className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-[#0047FF]/50 focus:bg-white transition appearance-none cursor-pointer"     >
          <option value="">All Games</option>
          <option value="Efootball">Efootball</option>
          <option value="Call of Duty">Call of Duty</option>
          <option value="Free Fire">Free Fire</option>
          <option value="PubG">PubG</option>
          <option value="Blood Strike">Blood Strike</option>
          <option value="EA Sports">EA Sports (FIFA)</option>
          <option value="Delta Force">Delta Force</option>
          <option value="DLS">Dream League Soccer</option>
        </select>
        <i className="ti ti-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" aria-hidden="true" />
      </div>
    </div>

    {/* Platform */}
    <div className="flex flex-col gap-1.5 flex-1 min-w-36">
      <label className="text-gray-400 text-[10.5px] font-semibold uppercase tracking-widest">
        Platform
      </label>
      <div className="relative">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-[#0047FF]/50 focus:bg-white transition appearance-none cursor-pointer" >
          <option value="">All Platforms</option>
          <option value="mobile">Mobile</option>
          <option value="pc">PC</option>
          <option value="xbox">Xbox</option>
          <option value="playstation">PlayStation</option>
        </select>
        <i className="ti ti-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" aria-hidden="true" />
      </div>
    </div>

    {/* Price Range */}
    <div className="flex flex-col gap-1.5 flex-1 min-w-36">
      <label className="text-gray-400 text-[10.5px] font-semibold uppercase tracking-widest">
        Price Range
      </label>
      <div className="flex gap-2  items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            ₦
          </span>
          <input
            type="number"
            min="0"
            value={priceRange[0] ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") { setPriceRange(["", priceRange[1]]); return; }
              let value = Number(val);
              if (value < 0) value = 0;
              if (value > priceRange[1]) value = priceRange[1];
              setPriceRange([value, priceRange[1]]);
            }}
            placeholder="Min"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-7 pr-3 py-1.5 focus:outline-none focus:border-[#0047FF]/50 focus:bg-white transition"
          />
        </div>
        <span className="text-gray-300 text-sm font-light">–</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            ₦
          </span>
          <input
            type="number"
            min="0"
            value={priceRange[1] ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") { setPriceRange([priceRange[0], ""]); return; }
              let value = Number(val);
              if (value > 50000000) value = 50000000;
              if (priceRange[0] !== "" && value < priceRange[0]) value = priceRange[0];
              setPriceRange([priceRange[0], value]);
            }}
            placeholder="Max"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-7 pr-3 py-1.5 focus:outline-none focus:border-[#0047FF]/50 focus:bg-white transition"
          />
        </div>
      </div>
      <ReactSlider
        className="w-full pt-1 flex items-center mt-1"
        thumbClassName="w-2.5 h-2.5 bg-[#0047FF] rounded-full cursor-grab focus:outline-none shadow-md shadow-[#0047FF]/30"
        trackClassName="h-1 bg-gray-200 rounded-full"
        min={0}
        max={50000000}
        value={priceRange}
        onChange={(val) => setPriceRange(val)}
        pearling
        minDistance={0}
        renderTrack={(props, state) => (
          <div
            {...props}
            className={`h-[3px] rounded-full ${state.index === 1 ? "bg-[#0047FF]" : "bg-gray-200"}`}
          />
        )}
      />
    </div>

    {/* Right side controls */}
    <div className="flex items-center gap-3 pb-0.5">
      {/* Verified toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => setVerifiedOnly((v) => !v)}
          className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${verifiedOnly ? "bg-emerald-500" : "bg-gray-200"}`}
        >
          <motion.div
            animate={{ x: verifiedOnly ? 16 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </div>
        <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${verifiedOnly ? "text-emerald-600" : "text-gray-400"}`}>
          Verified Only
        </span>
      </label>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Reset */}
      <button
        onClick={() => {
          setPlatform("");
          setType("");
          setVerifiedOnly(false);
          setSearch("");
          setPriceRange([0, 50000000]);
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 text-xs font-medium transition-all"
      >
        <i className="ti ti-rotate text-xs" aria-hidden="true" />
        Reset
      </button>
    </div>
  </div>
</motion.div>

          {/* Seller stats */}
          {isSeller && <DashboardStats />}

          {/* Games grid */}
          {loading || !isImagesReady ? (
            <GameCardsSkeleton />
          ) : filteredGames.length === 0 ? (
            <div className="min-h-[55vh] flex items-center justify-center">
              <NoGame />
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4"
            >
              {filteredGames.map((game, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    whileHover={{
                      y: -4,
                      boxShadow: "0 20px 40px rgba(0,71,255,0.10)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-full group hover:border-[#0047FF]/40 transition-colors"
                  >
                    {game.verified && (
                      <div className="absolute z-10 top-3 right-3">
                        <div className="flex items-center gap-1 bg-emerald-50 backdrop-blur-sm border border-emerald-200 text-emerald-600 text-[10px] font-semibold rounded-full px-2 py-1">
                          <Verified
                            className="fill-emerald-500 text-white"
                            size={10}
                          />
                          Verified
                        </div>
                      </div>
                    )}
                    <div className="relative overflow-hidden">
                      <img
                        src={game.cover_image}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={game.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent opacity-60" />
                      {game.verified && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1 bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 text-emerald-600 text-[10px] font-semibold rounded-full px-2 py-1">
                            <Verified
                              className="fill-emerald-500 text-white"
                              size={10}
                            />
                            Verified
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-end justify-between">
                      <div>
                        <p className="text-[#0047FF] font-bold text-sm mb-0.5">
                          {game.title}
                        </p>
                        <p className="text-gray-900 font-semibold text-base">
                          {formatGamePrice(game.price)}
                        </p>
                      </div>
                      <Link href={`/game${game.slug}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#0047FF] hover:bg-[#0040EE] text-white text-xs font-semibold rounded-xl transition"
                        >
                          Buy <ShoppingCart size={13} />
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function MarketplaceSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-[280px] shrink-0 h-screen bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        <div className="flex flex-col gap-1 px-3 py-4 flex-1">
          {/* Profile row */}
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Balance card */}
          <div className="mx-1 rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-gray-100 rounded" />
              <div className="h-3 w-4 bg-gray-100 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-full bg-gray-100 rounded-lg" />
          </div>

          <div className="h-px bg-gray-100 my-3 mx-1" />

          {/* Nav label */}
          <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse px-3 mb-2 ml-3" />

          {/* Nav items */}
          <div className="flex flex-col gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse">
                <div className="w-4 h-4 rounded bg-gray-100 shrink-0" />
                <div className="h-3 bg-gray-100 rounded flex-1" style={{ width: `${55 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Upgrade card */}
          <div className="mx-1 rounded-xl border border-gray-100 p-4 space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded" />
            <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <div className="h-12 bg-gray-100 rounded-2xl mb-5 animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-2xl mb-5 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse"
            >
              <div className="h-48 bg-gray-100" />
              <div className="p-4 flex justify-between items-end">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-14 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GameCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
        >
          <div className="h-48 bg-gray-100 animate-pulse" />
          <div className="p-4 flex justify-between items-end">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-8 w-14 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
