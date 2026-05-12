"use client";
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Headphones,
  Zap,
  Shield,
  Users,
  X,
  Store,
  BadgeDollarSign,
  Verified,
} from "lucide-react";
import Link from "next/link";
import Reveal from "../reveal";
import ChatWidget from "@/components/ChatWidget";
import { motion } from "framer-motion";

// ── tiny utility: stagger-reveal on scroll ──────────────────────────────────
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── STAT COUNTER ─────────────────────────────────────────────────────────────
function Counter({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(ease * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ── CHANNEL CARD ─────────────────────────────────────────────────────────────
function ChannelCard({ icon: Icon, title, desc, badge, href, delay, onClick }) {
  const ref = useFadeIn();
  return (
    <a
      href={href}
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        textDecoration: "none",
      }}
      onClick={onClick}
      className="channel-card"
    >
      <div className="channel-icon-wrap">
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <div className="channel-body">
        <span className="channel-title">{title}</span>
        <span className="channel-desc">{desc}</span>
      </div>
      {badge && <span className="channel-badge">{badge}</span>}
      <svg className="channel-arrow" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [refOpen, setOpenRef] = useState(false);

  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenRef(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const heroRef = useFadeIn();
  const formRef = useFadeIn();
  const statsRef = useFadeIn();
  const asideRef = useFadeIn();

  const linkClass = () =>
    `flex items-center gap-3 px-4 py-3 w-full border-b transition-colors duration-200
    "bg-white text-gray-800 border-gray-400/20 hover:bg-gray-100"
   `;

  useEffect(() => {
    if (!open) return;

    // lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // allow ESC to close
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
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
      } finally {
        setLoad(false);
      }
    };

    fetchUser();
  }, []);

  const categories = [
    "Account Issues",
    "Payment & Billing",
    "Trade Dispute",
    "Technical Bug",
    "Seller Verification",
    "Other",
  ];

  const faqs = [
    {
      q: "How long does it take to receive a response?",
      a: "Our support team typically responds within 2–4 hours during business hours. Priority and Enterprise plan users receive responses within 30 minutes.",
    },
    {
      q: "What information should I include in my report?",
      a: "For the fastest resolution, include your username, transaction ID (if applicable), a clear description of the issue, and any relevant screenshots.",
    },
    {
      q: "Can I dispute a completed transaction?",
      a: "Yes. Disputes can be opened within 48 hours of a completed trade. Navigate to your transaction history, select the trade, and click 'Open Dispute'.",
    },
    {
      q: "Is my personal information secure?",
      a: "Absolutely. All communications are encrypted and your data is handled in accordance with our Privacy Policy. We never share your information with third parties.",
    },
  ];

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blue:   #0000FF;
          --purple: #8A38F5;
          --indigo: #7A7AFE;
          --navy:   #0a0a2e;
          --ink:    #1a1a2e;
          --muted:  #6b7280;
          --surface: #ffffff;
          --border: rgba(122,122,254,0.18);
          --grad: linear-gradient(135deg, #4F8CFF, #8A38F5);
        }

        body { font-family: 'Sora', sans-serif; background: #fafafa; color: var(--ink); }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 16px 5%;
        }
        .nav-inner {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 10px 20px;
          box-shadow: 0 1px 6px rgba(0,0,255,.06);
        }
        .nav-logo { width:36px; height:36px; border-radius:50%; background:#0000FF; display:flex; align-items:center; justify-content:center; }
        .nav-logo img { width:20px; height:20px; object-fit:cover; }
        .nav-links { display:flex; gap:32px; }
        .nav-link { text-decoration:none; color:#808080; font-size:14px; font-weight:500; transition:color .2s; position:relative; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-2px; height:2px; width:100%; background:currentColor; transform:scaleX(0); transform-origin:right; transition:transform .4s ease; }
        .nav-link:hover { color:var(--blue); }
        .nav-link:hover::after { transform:scaleX(1); transform-origin:left; }
        .nav-link.active { color: var(--blue); }
        .nav-cta { display:flex; align-items:center; border:1px solid rgba(0,0,255,.35); border-radius:999px; overflow:hidden; font-size:13px; font-weight:500; }
        .nav-signin { padding:7px 18px; color:var(--blue); text-decoration:none; }
        .nav-signup { padding:7px 18px; background:var(--blue); color:#fff; text-decoration:none; border-radius:999px; }
        @media(max-width:768px){.nav-links,.nav-cta{display:none;}}

        /* ── HERO ── */
        .hero {
          min-height: 52vh;
          background: linear-gradient(170deg, #ffffff 0%, #eef0ff 50%, #c7c7ff 100%);
          display: flex; flex-direction:column; align-items:center; justify-content:center;
          text-align:center;
          padding: 140px 5% 80px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(ellipse 70% 60% at 50% 110%, rgba(138,56,245,.12) 0%, transparent 70%);
          pointer-events:none;
        }
        .hero-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:white; border:1px solid var(--border);
          border-radius:999px; padding:6px 16px;
          font-size:13px; color:var(--blue); font-weight:500;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(0,0,255,.08);
        }
        .hero-badge-dot { width:7px; height:7px; border-radius:50%; background:var(--blue); animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        .hero h1 {
          font-family:'DM Serif Display', serif;
          font-size: clamp(2.4rem, 6vw, 4rem);
          line-height: 1.12;
          color: var(--navy);
          max-width: 640px;
        }
        .hero h1 em { font-style:italic; background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .hero-sub {
          margin-top: 18px;
          font-size: 16px; color: var(--muted); max-width:480px; line-height:1.65;
        }
        .hero-orbs { position:absolute; pointer-events:none; }
        .orb { position:absolute; border-radius:50%; filter:blur(60px); opacity:.35; }
        .orb-a { width:260px; height:260px; background:#4F8CFF; top:-40px; left:-60px; }
        .orb-b { width:200px; height:200px; background:#8A38F5; bottom:20px; right:-40px; }

        /* ── CHANNELS ── */
        .channels { display: gap:16px; padding:0 5%; margin-top:-36px; position:relative; z-index:10; }
        .channel-card {
          display:flex; align-items:center; gap:14px;
          background:white;
          border:1px solid var(--border);
          border-radius:18px;
          padding:18px 20px;
          cursor:pointer;
          transition: box-shadow .25s, transform .25s, border-color .25s;
          position:relative;
          overflow:hidden;
        }
        .channel-card::before { content:''; position:absolute; inset:0; background:var(--grad); opacity:0; transition:opacity .25s; border-radius:inherit; }
        .channel-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,255,.12); border-color:var(--indigo); }
        .channel-icon-wrap {
          width:42px; height:42px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,rgba(79,140,255,.15),rgba(138,56,245,.15));
          color:var(--purple);
          position:relative; z-index:1;
          transition:background .25s, color .25s;
        }
       
        .channel-body { flex:1; display:flex; flex-direction:column; gap:2px; position:relative; z-index:1; }
        .channel-title { font-size:14px; font-weight:600; color:var(--ink); transition:color .2s; }
        .channel-desc { font-size:12px; color:var(--muted); transition:color .2s; }
        .channel-card:hover .channel-title,
        .channel-card:hover .channel-desc { color: #1D4ED8; }
        .channel-badge {
          font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px;
          background:linear-gradient(135deg,#4F8CFF,#8A38F5); color:#fff;
          position:relative; z-index:1;
          white-space:nowrap;
        }
        .channel-arrow { width:16px; height:16px; color:var(--muted); position:relative; z-index:1; flex-shrink:0; transition:color .2s, transform .2s; }
        .channel-card:hover .channel-arrow {  transform:translateX(3px); }

        /* ── LAYOUT: form + sidebar ── */
        .content { display:grid; grid-template-columns:1fr 360px; gap:32px; padding:56px 5% 80px; max-width:1200px; margin:0 auto; }
        @media(max-width:960px){ .content { grid-template-columns:1fr; } }

        /* ── FORM ── */
        .form-card {
          background:white; border:1px solid var(--border);
          border-radius:24px; padding:40px;
          box-shadow:0 4px 24px rgba(0,0,255,.05);
        }
        .form-title { font-family:'DM Serif Display', serif; font-size:1.75rem; color:var(--navy); margin-bottom:6px; }
        .form-sub { font-size:13px; color:var(--muted); margin-bottom:32px; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        @media(max-width:600px){ .form-row { grid-template-columns:1fr; } }
        .field { display:flex; flex-direction:column; gap:7px; margin-bottom:20px; }
        .field label { font-size:12px; font-weight:600; color:var(--ink); letter-spacing:.03em; text-transform:uppercase; }
        .field input, .field textarea, .field select {
          font-family:'Sora',sans-serif;
          font-size:14px; color:var(--ink);
          background:#fafafa;
          border:1px solid rgba(122,122,254,.22);
          border-radius:12px;
          padding:13px 16px;
          outline:none;
          transition:border-color .2s, box-shadow .2s, background .2s;
          resize:none;
          appearance:none;
        }
        .field input::placeholder, .field textarea::placeholder { color:#aaa; }
        .field input:focus, .field textarea:focus, .field select:focus {
          border-color:var(--indigo);
          background:#fff;
          box-shadow:0 0 0 3px rgba(122,122,254,.12);
        }
        .field textarea { min-height:140px; }
        .select-wrap { position:relative; }
        .select-wrap select { width:100%; padding-right:36px; cursor:pointer; }
        .select-wrap svg { position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--muted); }

        /* ── SUBMIT BTN ── */
        .submit-btn {
          width:100%; padding:15px; border:none; cursor:pointer;
          border-radius:14px;
          font-family:'Sora',sans-serif; font-size:15px; font-weight:600;
          background:var(--grad);
          color:#fff;
          display:flex; align-items:center; justify-content:center; gap:10px;
          transition:opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(79,140,255,.35);
        }
        .submit-btn:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 8px 28px rgba(79,140,255,.4); }
        .submit-btn:active { transform:scale(.98); }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }

        /* ── TOAST ── */
        .toast {
          display:flex; align-items:center; gap:10px;
          padding:13px 18px; border-radius:12px;
          font-size:13px; font-weight:500;
          margin-top:16px;
          animation:slideIn .3s ease;
        }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .toast-success { background:#f0fdf4; border:1px solid #86efac; color:#166534; }
        .toast-error   { background:#fff1f2; border:1px solid #fca5a5; color:#991b1b; }

        /* ── SIDEBAR ── */
        .sidebar { display:flex; flex-direction:column; gap:20px; }

        .info-card {
          background:white; border:1px solid var(--border);
          border-radius:20px; padding:28px;
          box-shadow:0 2px 16px rgba(0,0,255,.04);
        }
        .info-card-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:18px; }

        .hours-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(122,122,254,.08); font-size:13px; }
        .hours-row:last-child { border-bottom:none; }
        .hours-day { font-weight:500; color:var(--ink); }
        .hours-time { color:var(--muted); }
        .hours-live { display:inline-flex; align-items:center; gap:5px; background:#f0fdf4; color:#166534; border-radius:999px; padding:2px 9px; font-size:11px; font-weight:600; }
        .live-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:pulse 2s infinite; }

        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .stat-item { background:linear-gradient(135deg,rgba(79,140,255,.07),rgba(138,56,245,.07)); border-radius:14px; padding:16px 14px; text-align:center; }
        .stat-num { font-family:'DM Serif Display',serif; font-size:1.6rem; color:var(--navy); }
        .stat-lbl { font-size:11px; color:var(--muted); margin-top:2px; }

        .tip-card { background:var(--grad); border-radius:20px; padding:24px; color:white; }
        .tip-card-title { font-family:'DM Serif Display',serif; font-size:1.15rem; margin-bottom:10px; }
        .tip-card-text { font-size:13px; opacity:.88; line-height:1.6; }
        .tip-items { margin-top:14px; display:flex; flex-direction:column; gap:9px; }
        .tip-item { display:flex; align-items:flex-start; gap:9px; font-size:12px; opacity:.9; }
        .tip-icon { flex-shrink:0; margin-top:1px; }

        /* ── FAQ ── */
        .faq-section { padding:0 5% 80px; max-width:1200px; margin:0 auto; }
        .faq-heading { font-family:'DM Serif Display',serif; font-size:2rem; color:var(--navy); margin-bottom:6px; }
        .faq-sub { font-size:14px; color:var(--muted); margin-bottom:32px; }
        .faq-grid { display:grid; gap:16px; }
        @media(max-width:720px){ .faq-grid { grid-template-columns:1fr; } }
        .faq-item {
          border:1px solid var(--border); border-radius:18px;
          background:white; overflow:hidden;
          transition:box-shadow .2s;
        }
        .faq-item:hover,.faq-item:focus { box-shadow:0 6px 20px rgba(0,0,255,.07); }
        .faq-q {
          width:100%; display:flex; align-items:center; justify-content:space-between;
          padding:18px 22px; background:none; border:none; cursor:pointer;
          font-family:'Sora',sans-serif; font-size:14px; font-weight:600;
          color:var(--ink); text-align:left; gap:12px;
        }
        .faq-q svg { flex-shrink:0; color:var(--muted); transition:transform .3s; }
        .faq-q.open svg { transform:rotate(180deg); color:var(--purple); }
        .faq-a { padding:0 22px 18px; font-size:13px; color:var(--muted); line-height:1.7; }

        /* ── FOOTER STRIP ── */
        .footer-strip {
          background:var(--grad); color:white; text-align:center;
          padding:14px; font-size:12px; opacity:.9;
        }

        /* ── LOADING SPINNER ── */
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
      `}</style>

      {/* NAV */}
      {/* <div className="w-full px-[5%] mt-5 bg-transparent fixed z-100">
        <Reveal>
          <header className="relative">
            <div
              className={`px-[2%]  backdrop-blur-2xl transition-all duration-300 border-[#7A7AFE]/50 shadow-xs bg-white/95   ${open ? "rounded-t-4xl" : "rounded-4xl"}
         border`}
            >
              <div className="flex md:grid grid-cols-3 justify-between md:py-3 py-2 font-semibold items-center text-[#808080]  w-full">
                <img
                  src="/logo.png"
                  alt="Nepo Games"
                  className="w-9 h-9 p-2 rounded-[50%] bg-blue-700 object-cover"
                />
                <div className="hidden md:flex font-medium justify-center gap-9">
                  <Link
                    href={"/marketplace"}
                    className="
relative inline-block

after:content-['']
after:absolute
after:left-0
after:bottom-0
after:h-[2px]
after:w-full
after:bg-current

after:origin-right
after:scale-x-0

after:transition-transform
after:duration-500
after:ease-in-out

hover:after:origin-left
hover:after:scale-x-100

transition-colors
duration-500

hover:text-[#0000FF]
"
                  >
                    Marketplace
                  </Link>
                  <Link
                    href={"/pricing"}
                    className="    relative inline-block

    after:content-['']
    after:absolute
    after:left-0
    after:bottom-0
    after:h-[2px]
    after:w-full
    after:bg-current

    after:origin-right
    after:scale-x-0
    
        hover:text-[#0000FF] 


    after:transition-transform
    after:duration-500
    after:ease-in-out

    hover:after:origin-left
    hover:after:scale-x-100"
                  >
                    Pricing
                  </Link>

                  <Link
                    href={"/contact"}
                    className="
relative inline-block

after:content-['']
after:absolute
after:left-0
after:bottom-0
after:h-[2px]
after:w-full
after:bg-current

after:origin-right
after:scale-x-0

after:transition-transform
after:duration-500
after:ease-in-out

hover:after:origin-left
hover:after:scale-x-100

transition-colors
duration-500

hover:text-[#0000FF]
"
                  >
                    Contact
                  </Link>
                </div>
                <div>
                  <div className="hidden md:flex justify-end">
                    {!user?.profile_image ? (
                      <div className="flex border  text-blue-700 font-medium transition-all duration-200  hover:text-blue-800 border-blue-600/70 text-sm items-center rounded-2xl w-fit overflow-hidden">
                  
                        <Link
                          href={"/login"}
                          className="px-4 py-2 pr-5 hover:bg-blue-50 -mr-2"
                        >
                          Sign In
                        </Link>

                
                        <Link
                          href={"/signup"}
                          className="px-4 py-2 bg-blue-700 text-white rounded-l-2xl font-medium transition-all duration-200 hover:bg-blue-800 hover:scale-102 active:scale-95"
                        >
                          Sign Up
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div
                          ref={ref}
                          onMouseEnter={() => setOpenRef(true)}
                          className="relative  w-fit"
                        >
                          <a>
                            <img
                              src={user?.profile_image}
                              onClick={() => setOpenRef(true)}
                              alt="Nepo Games"
                              className="border-blue-600/70 border w-10 h-10 rounded-full object-cover cursor-pointer"
                            />
                            {user?.plan && user.plan !== "free" && (
                              <Verified
                                className="fill-green-600 fixed -mt-3 ml-6 text-green-100"
                                size={16}
                              />
                            )}
                          </a>

      
                          {refOpen && (
                            <div className="cursor-pointer">
                              {" "}
                              <div className="absolute  right-0 mt-1 bg-white/95  backdrop-blur-md border  border-[#7A7AFE]/50 shadow-sm rounded-sm z-50 overflow-hidden transition-all duration-200">
                               
                                <Link
                                  href={"/profile"}
                                  className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition"
                                >
                                  <span className="text-xs">👤</span>
                                  Profile
                                </Link>{" "}
                                <div className="h-px bg-gray-200 mx-2"></div>
                                <Link
                                  href={"/marketplace"}
                                  className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition"
                                >
                                  <span className="text-xs">🛒</span>
                                  Marketplace
                                </Link>
                                <div className="h-px bg-gray-200 mx-2"></div>
                            
                                <button
                                  onClick={() => {
                                    setOpenRef(false);
                                    setLogOpen(true);
                                  }}
                                  className="flex items-center cursor-pointer gap-3 w-full px-4 py-3 text-xs text-red-500 hover:bg-red-50 transition"
                                >
                                  <span className="text-xs">🚪</span>
                                  Logout
                                </button>
                              </div>{" "}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="md:hidden pr-3 flex transition-all duration-300 justify-center md:pr-0">
                    <button onClick={() => setOpen(!open)}>
                      {open ? (
                        <div className="-mr-1">
                          <X size={23} className=" text-blue-700" />
                        </div>
                      ) : (
                        <img
                          src="/menu-open.png"
                          alt="Open menu"
                          className="w-4 object-cover"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`fixed top-13 rounded-b-4xl transition-all duration-300 right-0 w-full border-[#bbbbf6] border border-t-0 z-1050 transform        
 ease-out
  ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
            >
              <div className="p-6 pt-0  backdrop-blur-2xl  shadow-xs rounded-b-4xl bg-white/95  h-full flex flex-col justify-between">
                <div className="bg-[#7A7AFE]/50 h-[0.5] -mx-6"></div>
                {user?.username ? (
                  <div>
                    <div className="flex items-center gap-3 pt-3">
                      <div className="w-12 h-12 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                        <img
                          src={user?.profile_image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        {user?.plan && user.plan !== "free" && (
                          <Verified
                            className="fill-green-600 fixed -mt-3 ml-7 text-green-100"
                            size={16}
                          />
                        )}
                      </div>
                      <p>
                        Welcome back,{" "}
                        <span className="font-semibold">{user?.username}</span>
                      </p>
                    </div>
                    <p className="pb-3 pt-1 text-xs">
                      Not you?{" "}
                      <button
                        onClick={() => {
                          setOpen(false);
                          setLogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        Log out
                      </button>
                    </p>
                    <div className="bg-[#7A7AFE]/50 h-[1] -mx-6"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-12 h-12 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                          <img
                            src="/profile.png"
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p>
                          <Link
                            href={"/login"}
                            className="font-semibold text-blue-600"
                          >
                            Sign In
                          </Link>{" "}
                          to your account
                        </p>
                      </div>
                      <div className="bg-[#7A7AFE]/50 h-[1] -mx-6"></div>
                    </div>
                  </>
                )}
                <div className="flex text-base text-[#262626]  flex-col gap-6 h-full font-semibold -mb-2.5">
                  <div className="flex flex-col -mb-6 -mx-6">
                    <Link href={"/marketplace"}>
                      <button
                        onClick={() => setActive("Marketplace")}
                        className={`${linkClass("Marketplace")}   group`}
                      >
                        <Store
                          size={20}
                          className="text-black group-hover:text-blue-600 transition-colors duration-200"
                        />
                        <span className=" group-hover:text-blue-600 ">
                          Marketplace
                        </span>
                      </button>
                    </Link>

                    <Link href={"/pricing"}>
                      <button
                        onClick={() => setActive("Pricing")}
                        className={`${linkClass("Pricing")} group`}
                      >
                        <BadgeDollarSign
                          size={20}
                          className="text-black group-hover:text-blue-600 transition-colors duration-200"
                        />
                        <span className=" group-hover:text-blue-600 ">
                          Pricing
                        </span>
                      </button>
                    </Link>

                    <Link href="/contact">
                      <button
                        onClick={() => setActive("Support")}
                        className={`${linkClass("Support")} border-b-0 group`}
                      >
                        <Headphones
                          size={20}
                          className="text-black group-hover:text-blue-600 transition-colors duration-200"
                        />
                        <span className=" group-hover:text-blue-600 ">
                          Contact
                        </span>
                      </button>
                    </Link>
                  </div>
                  {user?.username ? (
                    <>
                      <div className="flex items-center pt-3 border-t border-[#7A7AFE]/50 -mx-6 justify-between text-sm">
                        <div className="w-10 h-10 ml-6 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                          <img
                            src={user?.profile_image}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                          {user?.plan && user.plan !== "free" && (
                            <Verified
                              className="fill-green-600 fixed -mt-3 ml-6 text-green-100"
                              size={16}
                            />
                          )}
                        </div>
                        <Link
                          href={"/profile"}
                          className="mr-6
                 flex items-center justify-center
      py-2 px-3 rounded-xl border 
      bg-[#0000FF] text-white font-bold
            border-gray-400/50
      transition-all duration-300
      hover:bg-blue-700
      active:bg-blue-700
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    "
                        >
                          Go to Profile
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {" "}
                      <div className="flex items-center pt-3 border-t border-[#7A7AFE]/50 -mx-6 justify-between text-sm">
                        <div className="w-10 h-10 ml-6 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                          <img
                            src="/profile.png"
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link
                          href={"/signup"}
                          className="mr-6
                 flex items-center justify-center
      py-2 px-3 rounded-xl border 
      bg-[#0000FF] text-white font-bold
            border-gray-400/50
      transition-all duration-300
      hover:bg-blue-700
      active:bg-blue-700
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    "
                        >
                          Sign Up
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
        </Reveal>
      </div> */}

      {/* {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )} */}

      {/* HERO */}
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <section className="hero">
        <div className="hero-orbs">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
        </div>
        <div
          ref={heroRef}
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Support available now
          </div>
          <h1>
            We're here to <em>help you</em> trade with confidence
          </h1>
          <div className="w-full flex justify-center ">
            <p className="hero-sub">
              Reach our expert support team for any trading issue, account
              question, or technical concern. Your peace of mind is our
              priority.
            </p>
          </div>
        </div>
      </section>

      {/* CHANNEL CARDS */}
      <div className="channels grid md:grid-cols-2 gap-4">
        <ChannelCard
          icon={MessageCircle}
          title="Live Chat"
          desc="Get instant answers"
          badge="Online"
          href="#"
          delay={0}
          onClick={(e) => {
            e.preventDefault();
            setChatOpen(true);
          }}
        />
        <ChannelCard
          icon={Mail}
          title="Email Support"
          desc="support@nepogames.gg"
          // href="mailto:support@nepogames.gg"
          delay={80}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="content">
        {/* FORM */}
        <div
          ref={formRef}
          style={{
            opacity: 0,
            transform: "translateY(28px)",
            transition: "opacity .55s ease .1s, transform .55s ease .1s",
          }}
        >
          <div className="form-card">
            <p className="form-title">Send us a message</p>
            <p className="form-sub">
              Fill in the details below and we'll get back to you as soon as
              possible.
            </p>

            <div className="form-row">
              <div className="field">
                <label>Full Name</label>
                <input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Category</label>
                <div className="select-wrap">
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </div>
              </div>
              <div className="field">
                <label>Subject</label>
                <input
                  placeholder="Brief description of your issue"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Message</label>
              <textarea
                placeholder="Describe your issue in detail. Include any transaction IDs or relevant information..."
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
              />
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <>
                  <div className="spinner" /> Sending…
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle size={18} /> Message Sent!
                </>
              ) : (
                <>
                  <Send size={17} /> Send Message
                </>
              )}
            </button>

            {status === "success" && (
              <div className="toast toast-success">
                <CheckCircle size={16} />
                Your message has been received. We'll respond within 2–4 hours.
              </div>
            )}
            {status === "error" && (
              <div className="toast toast-error">
                <AlertCircle size={16} />
                Please fill in your name, email, and message before submitting.
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <aside
          className="sidebar"
          ref={asideRef}
          style={{
            opacity: 0,
            transform: "translateY(28px)",
            transition: "opacity .55s ease .1s, transform .55s ease .1s",
          }}
        >
          {/* Support Hours */}
          <div className="info-card">
            <p className="info-card-title">Support Hours</p>
            {[
              { day: "Monday – Friday", time: "8 AM – 10 PM WAT", live: true },
              { day: "Saturday", time: "10 AM – 6 PM WAT", live: false },
              { day: "Sunday", time: "12 PM – 5 PM WAT", live: false },
            ].map(({ day, time, live }) => (
              <div className="hours-row" key={day}>
                <span className="hours-day">{day}</span>
                {live ? (
                  <span className="hours-live">
                    <span className="live-dot" />
                    Live
                  </span>
                ) : (
                  <span className="hours-time">{time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            ref={statsRef}
            style={{
              opacity: 0,
              transform: "translateY(18px)",
              transition: "opacity .55s ease .25s, transform .55s ease .25s",
            }}
          >
            <div className="info-card">
              <p className="info-card-title">Support by the numbers</p>
              <div className="stat-grid">
                {[
                  { val: 98, suf: "%", lbl: "Satisfaction Rate" },
                  { val: 2, suf: "hr", lbl: "Avg. Response" },
                  { val: 50, suf: "k+", lbl: "Tickets Resolved" },
                  { val: 24, suf: "/7", lbl: "Bot Availability" },
                ].map(({ val, suf, lbl }) => (
                  <div className="stat-item" key={lbl}>
                    <div className="stat-num">
                      <Counter target={val} suffix={suf} />
                    </div>
                    <div className="stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          {/* <div className="tip-card">
            <p className="tip-card-title">Faster resolution tips</p>
            <p className="tip-card-text">
              Include these details to help our team resolve your issue quickly.
            </p>
            <div className="tip-items">
              {[
                {
                  icon: <Zap size={13} />,
                  text: "Your Nepogames username or user ID",
                },
                {
                  icon: <Shield size={13} />,
                  text: "Transaction or trade reference number",
                },
                {
                  icon: <Users size={13} />,
                  text: "Screenshot of the issue (if applicable)",
                },
                {
                  icon: <Clock size={13} />,
                  text: "Date and time the issue occurred",
                },
              ].map(({ icon, text }) => (
                <div className="tip-item" key={text}>
                  <span className="tip-icon">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div> */}
        </aside>
      </div>
      {!chatOpen &&
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="
    fixed bottom-5 right-5
    z-[9999]
    w-14 h-14
    rounded-full
    bg-blue-600 hover:bg-blue-700
    text-white shadow-md
    flex items-center justify-center
    border-2 border-white
  "
        onClick={(e) => {
          e.preventDefault();
          setChatOpen(true);
        }}
      >
        <MessageCircle size={24} />
      </motion.button>}
      {/* FAQ */}
      <section className="faq-section">
        <p className="faq-heading">Frequetly Asked Questions</p>
        <p className="faq-sub">Quick answers to things we hear most often.</p>
        <div className="flex justify-center">
          <div className="faq-grid w-[90%]">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button
                  className={`faq-q ${openFaq === i ? "open" : ""}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown size={16} />
                </button>
                {openFaq === i && <p className="faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER STRIP */}
      <div className="footer-strip">
        © {new Date().getFullYear()} Nepo Games · All rights reserved · Built
        with care for the gaming community
      </div>
    </>
  );
}
