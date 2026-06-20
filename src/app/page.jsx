"use client";
import {
  X,
  ChevronDown,
  Store,
  BadgeDollarSign,
  Info,
  Headphones,
  User2Icon,
  Plus,
  SlidersHorizontal,
  Tag,
  Trophy,
  Menu,
  Shield,
  Zap,
  ArrowRight,
  Star,
  CheckCircle2,
  TrendingUp,
  Users,
  Lock,
  Globe,
} from "lucide-react";
import Image from "next/image";
import Reveal from "./reveal";
import { useEffect, useRef, useState, useMemo, use } from "react";
import Reviews from "./review";
import Footer from "./footer";
import RevealRight from "./revealfright";
import RevealLeft from "./revealfrleft";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Verified } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/Loader";
import HashScrollHandler from "./hash";
import Marquee from "./game";

function StatCard({ value }) {
  const cardRef = useRef(null);
  const startedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);

  const parsed = useMemo(() => {
    const num = parseInt(value);
    const suffix = value.toLowerCase().includes("k") ? "k" : "";
    const plus = value.includes("+") ? "+" : "";
    return { number: num, suffix, plus };
  }, [value]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const duration = 2000;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = Math.round(eased * parsed.number);
          setDisplayValue(current);
          if (t < 1) requestAnimationFrame(tick);
          else setDisplayValue(parsed.number);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [parsed.number]);

  return (
    <div ref={cardRef}>
      {displayValue}
      {parsed.suffix}
      {parsed.plus}
    </div>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const innerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [refOpen, setOpenRef] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [load, setLoad] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return;
    setEmail("");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          setUser(null);
          return;
        }
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setFading(true);
        setTimeout(() => setLoad(false), 300);
      }
    };
    fetchUser();
  }, []);

  const router = useRouter();
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenRef(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("nepo-user");
    await signOut({ callbackUrl: "/login" });
  };

  const linkClass = () =>
    `flex items-center gap-3 px-4 py-3 w-full border-b transition-colors duration-200
    "bg-white text-gray-800 border-gray-400/20 hover:bg-gray-100"
   `;

  const games = [
    { name: "Delta Force", logo: "/deltaforce_512.png" },
    { name: "Efootball", logo: "/efootball_512.png" },
    { name: "Mobile Legends", logo: "/mobile_legends_512.png" },
    { name: "Call Of Duty Mobile", logo: "/call_of_duty_512.png" },
    { name: "Fortnite", logo: "/fortnite_512.png" },
    { name: "Minecraft", logo: "/minecraft_512.png" },
    { name: "Pubg Mobile", logo: "/pubg_512.png" },
    { name: "Gameloft", logo: "/gameloft_512.png" },
    { name: "Free Fire", logo: "/freefire.png" },
    { name: "Blood Strike", logo: "/bloodstrike.png" },
  ];

  useEffect(() => {
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const faqs = [
    {
      question: "Why choose Nepogames?",
      reply:
        "Nepogames is a trusted platform where gamers can easily buy and sell games. We focus on fair pricing, fast transactions, and a smooth experience so players can get the games they want without hassle.",
    },
    {
      question: "How does Nepogames work?",
      reply:
        "Nepogames connects buyers and sellers of games on one platform. Sellers list their games, buyers browse and purchase them, and the platform handles the transaction securely.",
    },
    {
      question: "Is Nepogames secure?",
      reply:
        "Yes. Nepogames is designed with security in mind to protect both buyers and sellers. Transactions are handled safely and user information is protected to ensure a reliable marketplace.",
    },
    {
      question: "How do I buy a game on Nepogames?",
      reply:
        "Simply browse the available games, select the one you want, and complete the checkout process. Once payment is confirmed, the game or activation details will be delivered to you quickly.",
    },
    {
      question: "How do I sell my games on Nepogames?",
      reply:
        "Create a seller account, list your game with the necessary details, and set your price. Once a buyer purchases your game, the platform helps complete the transaction securely.",
    },
    {
      question: "How long does it take to receive my game?",
      reply:
        "Most purchases are processed quickly after payment confirmation. In many cases, buyers receive their game details almost instantly.",
    },
    {
      question: "Can I get a refund?",
      reply:
        "Refunds may be available depending on the situation and platform policy. If you experience any issue with your purchase, you can contact support for assistance.",
    },
    {
      question: "How can I contact support?",
      reply:
        "If you need help, you can reach out to the Nepogames support team through the contact section on the website. Our team will assist you as quickly as possible.",
    },
  ];

  const items = useMemo(() => [...games, ...games], [games]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
    const el = innerRef.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll("img"));
    let cancelled = false;
    const waitForImages = async () => {
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          });
        }),
      );
      if (cancelled) return;
      el.style.transform = "translate3d(0,0,0)";
      el.offsetHeight;
      el.style.transform = "";
      setReady(true);
    };
    waitForImages();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const scrollerRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerInner = scroller.querySelector(".scroller_inner");
    if (!scrollerInner) return;
    if (scrollerInner.dataset.cloned === "true") return;
    scrollerInner.dataset.cloned = "true";
    const items = Array.from(scrollerInner.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      scrollerInner.appendChild(clone);
    });
  }, []);

  return (
    <div>
      <HashScrollHandler />

      {/* ── Logout confirmation modal ── */}
      {logOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Confirm logout</h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to log out of this device?
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setLogOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white">
        <div>
          {/* ── NAVBAR ── */}
          <div className="w-full px-[5%] mt-5 bg-transparent fixed z-100">
            <Reveal>
              <header className="relative">
                <div
                  className={`px-[2%] backdrop-blur-2xl transition-all duration-300 border-[#7A7AFE]/50 shadow-xs bg-white/95 ${open ? "rounded-t-4xl" : "rounded-4xl"} border`}
                >
                  <div className="flex md:grid grid-cols-3 justify-between md:py-3 py-2 font-semibold items-center text-[#808080] w-full">
                    <Link href={"/#"}>
                      <Image
                        src="/logo.png"
                        alt="Nepo Games"
                        height={36}
                        width={36}
                        className="w-9 h-9 p-2 rounded-[50%] bg-blue-700 object-cover"
                        priority
                      />
                    </Link>
                    <div className="hidden md:flex font-medium justify-center gap-9">
                      <Link
                        href={"/marketplace"}
                        className="relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-current after:origin-right after:scale-x-0 after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 transition-colors duration-500 hover:text-[#0000FF]"
                      >
                        Marketplace
                      </Link>
                      <Link
                        href={"/pricing"}
                        className="relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-current after:origin-right after:scale-x-0 hover:text-[#0000FF] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100"
                      >
                        Pricing
                      </Link>
                      <Link
                        href={"/contact"}
                        className="relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-current after:origin-right after:scale-x-0 after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 transition-colors duration-500 hover:text-[#0000FF]"
                      >
                        Contact
                      </Link>
                    </div>
                    <div>
                      <div className="hidden md:flex justify-end">
                        {!user?.profile_image ? (
                          /* ── CHANGED: Single "Get Started" pill button matching design ── */
                          <div className="flex items-center gap-3">
                            <Link
                              href={"/login"}
                              className="px-5 py-2.5 rounded-full bg-[#0000FF] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,0,255,0.3)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(0,0,255,0.4)] active:scale-95 transition-all duration-200"
                            >
                              Get Started
                            </Link>
                          </div>
                        ) : (
                          <div
                            ref={ref}
                            onMouseEnter={() => setOpenRef(true)}
                            className="relative w-fit"
                          >
                            <a>
                              <Image
                                src={user?.profile_image}
                                onClick={() => setOpenRef(true)}
                                width={40}
                                height={40}
                                alt="Nepo Games"
                                className="border-blue-600/70 border w-10 h-10 rounded-full object-cover cursor-pointer"
                                priority
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
                                <div className="absolute right-0 mt-1 bg-white/95 backdrop-blur-md border border-[#7A7AFE]/50 shadow-sm rounded-sm z-50 overflow-hidden transition-all duration-200">
                                  <Link
                                    href={"/profile"}
                                    className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition"
                                  >
                                    <span className="text-xs">👤</span>Profile
                                  </Link>
                                  <div className="h-px bg-gray-200 mx-2"></div>
                                  <Link
                                    href={"/tournament"}
                                    className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition"
                                  >
                                    <span className="text-xs">🏆</span>
                                    Tournaments
                                  </Link>
                                  <div className="h-px bg-gray-200 mx-2"></div>
                                  <button
                                    onClick={() => {
                                      setOpenRef(false);
                                      setLogOpen(true);
                                    }}
                                    className="flex items-center cursor-pointer gap-3 w-full px-4 py-3 text-xs text-red-500 hover:bg-red-50 transition"
                                  >
                                    <span className="text-xs">🚪</span>Logout
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="md:hidden pr-3 flex transition-all duration-300 justify-center md:pr-0">
                        <button onClick={() => setOpen(!open)}>
                          {open ? (
                            <div className="-mr-1">
                              <X size={23} className="text-blue-700" />
                            </div>
                          ) : (
                            <Image
                              src="/menu-open.png"
                              alt="Open menu"
                              height={16}
                              width={16}
                              className="w-4 object-cover"
                              priority
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile nav drawer */}
                <div
                  className={`fixed top-13 rounded-b-4xl transition-all duration-300 right-0 w-full border-[#bbbbf6] border border-t-0 z-1050 transform ease-out ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
                >
                  <div className="p-6 pt-0 backdrop-blur-2xl shadow-xs rounded-b-4xl bg-white/95 h-full flex flex-col justify-between">
                    <div className="bg-[#7A7AFE]/50 h-[0.5] -mx-6"></div>
                    {user?.username ? (
                      <div>
                        <div className="flex items-center gap-3 pt-3">
                          <div className="w-12 h-12 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                            <Image
                              height={48}
                              width={48}
                              priority
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
                            <span className="font-semibold">
                              {user?.username}
                            </span>
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
                      <div>
                        <div className="flex items-center gap-3 py-3">
                          <div className="w-12 h-12 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                            <Image
                              height={48}
                              width={48}
                              priority
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
                    )}
                    <div className="flex text-base text-[#262626] flex-col gap-6 h-full font-semibold -mb-2.5">
                      <div className="flex flex-col -mb-6 -mx-6">
                        <Link href={"/marketplace"}>
                          <button
                            onClick={() => setActive("Marketplace")}
                            className={`${linkClass("Marketplace")} group`}
                          >
                            <Store
                              size={20}
                              className="text-black group-hover:text-blue-600 transition-colors duration-200"
                            />
                            <span className="group-hover:text-blue-600">
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
                            <span className="group-hover:text-blue-600">
                              Pricing
                            </span>
                          </button>
                        </Link>
                        <Link href={"/tournament"}>
                          <button
                            onClick={() => setActive("Tournament")}
                            className={`${linkClass("Tournament")} group`}
                          >
                            <Trophy
                              size={20}
                              className="text-black group-hover:text-blue-600 transition-colors duration-200"
                            />
                            <span className="group-hover:text-blue-600">
                              Tournaments
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
                            <span className="group-hover:text-blue-600">
                              Contact
                            </span>
                          </button>
                        </Link>
                      </div>
                      {user?.username ? (
                        <div className="flex items-center pt-3 border-t border-[#7A7AFE]/50 -mx-6 justify-between text-sm">
                          <div className="w-10 h-10 ml-6 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                            <Image
                              height={40}
                              width={40}
                              priority
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
                            className="mr-6 flex items-center justify-center py-2 px-3 rounded-xl border bg-[#0000FF] text-white font-bold border-gray-400/50 transition-all duration-300 hover:bg-blue-700 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            Go to Profile
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center pt-3 border-t border-[#7A7AFE]/50 -mx-6 justify-between text-sm">
                          <div className="w-10 h-10 ml-6 rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
                            <Image
                              height={40}
                              width={40}
                              priority
                              src="/profile.png"
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Link
                            href={"/signup"}
                            className="mr-6 flex items-center justify-center py-2 px-3 rounded-xl border bg-[#0000FF] text-white font-bold border-gray-400/50 transition-all duration-300 hover:bg-blue-700 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            Sign Up
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </header>
            </Reveal>
          </div>

          {open && (
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
          )}

          <main>
            {/* ── HERO SECTION — Clean white with decorative SVG elements ── */}
            <div className="relative bg-white overflow-hidden min-h-screen mb-0 pb-0">
              {/* ── Decorative: concentric arcs top-left (matching design) ── */}
              <div
                className="absolute top-0 left-0 w-64 h-64 pointer-events-none select-none opacity-60"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 260 260"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="80"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="120"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="160"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="200"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="240"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
              </div>

              {/* ── Decorative: botanical leaf left-center (matching design) ── */}
              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 w-28 sm:w-36 pointer-events-none select-none opacity-70"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 140 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    d="M70 260 Q10 200 20 120 Q30 60 70 20 Q110 60 120 120 Q130 200 70 260Z"
                    fill="#C7D7FF"
                    fillOpacity="0.5"
                  />
                  <path
                    d="M70 260 Q70 160 70 20"
                    stroke="#7AA0FF"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M70 200 Q40 170 25 140"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M70 200 Q100 170 115 140"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M70 155 Q45 130 32 100"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M70 155 Q95 130 108 100"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M70 110 Q52 88 44 65"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M70 110 Q88 88 96 65"
                    stroke="#7AA0FF"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              </div>

              {/* ── Decorative: gamepad silhouette top-right (matching design) ── */}
              <div
                className="absolute right-0 top-16 sm:top-20 w-48 sm:w-72 pointer-events-none select-none opacity-30"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 320 260"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  {/* Controller body */}
                  <path
                    d="M60 80 Q40 80 30 100 L10 180 Q5 210 30 220 Q55 230 75 200 L95 165 H225 L245 200 Q265 230 290 220 Q315 210 310 180 L290 100 Q280 80 260 80 Z"
                    fill="#BFBFFF"
                    fillOpacity="0.6"
                  />
                  {/* D-pad */}
                  <rect
                    x="70"
                    y="118"
                    width="14"
                    height="40"
                    rx="3"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  <rect
                    x="56"
                    y="132"
                    width="14"
                    height="14"
                    rx="3"
                    fill="#9090EE"
                    fillOpacity="0.7"
                    transform="translate(14,0)"
                  />
                  <rect
                    x="84"
                    y="132"
                    width="14"
                    height="14"
                    rx="3"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  {/* Buttons */}
                  <circle
                    cx="225"
                    cy="118"
                    r="8"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  <circle
                    cx="245"
                    cy="138"
                    r="8"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  <circle
                    cx="205"
                    cy="138"
                    r="8"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  <circle
                    cx="225"
                    cy="158"
                    r="8"
                    fill="#9090EE"
                    fillOpacity="0.7"
                  />
                  {/* Plus decoration */}
                  <rect
                    x="290"
                    y="38"
                    width="8"
                    height="34"
                    rx="4"
                    fill="#7A7AFF"
                    fillOpacity="0.5"
                  />
                  <rect
                    x="276"
                    y="52"
                    width="34"
                    height="8"
                    rx="4"
                    fill="#7A7AFF"
                    fillOpacity="0.5"
                  />
                  {/* Circle decoration */}
                  <circle
                    cx="295"
                    cy="12"
                    r="8"
                    fill="#7A7AFF"
                    fillOpacity="0.4"
                  />
                  {/* Dots */}
                  <circle
                    cx="265"
                    cy="38"
                    r="5"
                    fill="#7A7AFF"
                    fillOpacity="0.35"
                  />
                </svg>
              </div>

              {/* ── Decorative: concentric arcs bottom-right ── */}
              <div
                className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none select-none opacity-40"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="60"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="100"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    stroke="#BFBFFF"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
              </div>

              <Reveal>
                <div className="relative z-10 pt-40 sm:pt-44 px-[5%] pb-0">
                  {/* ── Badge pill — solid blue matching design ── */}
                  <div className="justify-center flex">
                    <div className="bg-[#0000FF] flex justify-center items-center gap-2 p-1 px-3 rounded-2xl shadow-[0_4px_14px_rgba(0,0,255,0.25)]">
                      <Link href={"/#"}>
                        <Image
                          height={20}
                          width={20}
                          priority
                          src="/logo.png"
                          alt="Nepo Games"
                          className="w-5 h-5 p-1 animate-pulse rounded-[50%] bg-white/20 object-cover"
                        />
                      </Link>
                      <p className="text-white text-sm font-medium">
                        Best Gaming Marketplace
                      </p>
                    </div>
                  </div>

                  {/* ── Headline — larger, bolder, two-line like design ── */}
                  <div className="text-center pt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-[#0a0a1a]">
                    <p>Trade Your Gaming Account with</p>
                    <p className="mt-1 text-[#0000FF] font-bold">Nepogames.</p>
                  </div>

                  {/* ── Sub-copy ── */}
                  <div className="text-center mt-5 flex w-full justify-center">
                    <div className="max-w-lg">
                      <p className="text-gray-500 text-base leading-relaxed">
                        Redefining how premium gaming accounts are traded —
                        securely and transparently. Skip the grind.{" "}
                        <span className="font-bold text-[#0000FF]">
                          Trade with confidence.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ── CTA buttons — LOCKED, unchanged ── */}
                  <Reveal>
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
                      <Link
                        href="/marketplace"
                        className="
                  inline-flex items-center gap-2
                  bg-[#0000FF] text-white
                  px-7 py-3.5 rounded-xl
                  text-sm font-semibold
                  shadow-[0_4px_16px_rgba(0,0,255,0.35)]
                  hover:bg-blue-700 hover:shadow-[0_6px_24px_rgba(0,0,255,0.45)]
                  hover:gap-3 active:scale-95
                  transition-all duration-200
                "
                      >
                        Browse marketplace
                        <ArrowRight size={15} />
                      </Link>
                      <Link
                        href="/sell-game"
                        className="
                  inline-flex items-center gap-2
                  bg-white text-[#0A0A1A]
                  px-7 py-3.5 rounded-xl
                  text-sm font-semibold
                  border border-gray-200
                  hover:border-[#0000FF] hover:text-[#0000FF]
                  active:scale-95
                  transition-all duration-200
                "
                      >
                        List your account
                      </Link>
                    </div>
                  </Reveal>

                  {/* ── Micro-trust signals — LOCKED, unchanged ── */}
                  <Reveal>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                      {[
                        { icon: Shield, text: "Escrow protected" },
                        { icon: Zap, text: "Instant delivery" },
                        { icon: Lock, text: "Verified accounts" },
                      ].map(({ icon: Icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-1.5 text-xs text-gray-400"
                        >
                          <Icon size={13} className="text-[#0000FF]" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </Reveal>
                  <div className="justify-center  -mx-[6%] mt-5 rounded-b-2xl  flex">
                    {/* ── LOCKED: Hero image ── */}
                    <Image
                      src="/home-gen-pic.png"
                      alt=""
                      width={1152}
                      height={200}
                      className="object-cover overflow-hidden rounded-b-2xl w-6xl h-50 sm:h-70 lg:h-96.75"
                      priority
                    />
                  </div>
                  
                </div>
              </Reveal>
            </div>

            {/* ─────────────────────────────────────────────────────────────
              REMAINING SECTIONS — unchanged below
            ───────────────────────────────────────────────────────────── */}

            {/* ── Game logo scroller ── */}
            <Reveal>
              <Marquee/>
            </Reveal>

            {/* ── HOW IT WORKS ── */}
          {/* ── HOW IT WORKS ── */}
<section className="bg-white py-24 px-[5%] overflow-x-hidden">
  <Reveal>
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-center mb-5">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#0000FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
          Why Trade Nepogames?
        </span>
      </div>
      <h2 className="text-center text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#0a0a1a] leading-tight mb-4">
        Why trade with us!
      </h2>
      <p className="text-center text-gray-500 max-w-xl mx-auto mb-16 text-base leading-relaxed">
        Everything you need for a secure, seamless gaming account marketplace — built for buyers and sellers alike.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1 — E-SCROW (large, spans 2 cols on lg) */}
        <RevealLeft>
          <Link href="/marketplace" className="block h-full">
            <div className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-[0_8px_40px_rgba(0,0,255,0.07)] transition-all duration-300 h-full flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                <BadgeDollarSign size={22} className="text-[#0000FF]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0a0a1a] uppercase tracking-wide mb-2">
                  E-Scrow Payment.
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Trade with confidence — your payment stays protected until both parties confirm the deal.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0000FF] group-hover:gap-2.5 transition-all duration-200">
                  Browse Marketplace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </RevealLeft>

        {/* Card 2 — CHAT */}
        <RevealRight>
          <Link href="/marketplace" className="block h-full">
            <div className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-[0_8px_40px_rgba(0,0,255,0.07)] transition-all duration-300 h-full flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors duration-300">
                <Headphones size={22} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0a0a1a] uppercase tracking-wide mb-2">
                  Chat.
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Communicate directly with buyers and sellers to ensure smooth, transparent transactions.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0000FF] group-hover:gap-2.5 transition-all duration-200">
                  Browse Marketplace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </RevealRight>

        {/* Card 3 — FILTERED SEARCH */}
        <RevealLeft>
          <Link href="/marketplace" className="block h-full">
            <div className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-[0_8px_40px_rgba(0,0,255,0.07)] transition-all duration-300 h-full flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-300">
                <SlidersHorizontal size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0a0a1a] uppercase tracking-wide mb-2">
                  Filtered Search.
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Easily filter listings by game, price, rank, and more to find the perfect account in seconds.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0000FF] group-hover:gap-2.5 transition-all duration-200">
                  Browse Marketplace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </RevealLeft>

        {/* Card 4 — FAST & SECURE */}
        <RevealRight>
          <Link href="/marketplace" className="block h-full">
            <div className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-[0_8px_40px_rgba(0,0,255,0.07)] transition-all duration-300 h-full flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors duration-300">
                <Zap size={22} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0a0a1a] uppercase tracking-wide mb-2">
                  Fast &amp; Secure
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enjoy lightning-fast transactions and robust security designed to keep every trade safe and seamless.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0000FF] group-hover:gap-2.5 transition-all duration-200">
                  Browse Marketplace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </RevealRight>

        {/* Card 5 — 24/7 SUPPORT */}
        <RevealLeft>
          <Link href="/contact" className="block h-full">
            <div className="group relative bg-white border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-[0_8px_40px_rgba(0,0,255,0.07)] transition-all duration-300 h-full flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                <Users size={22} className="text-[#0000FF]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0a0a1a] uppercase tracking-wide mb-2">
                  24/7 Support.
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Get fast, reliable assistance anytime with our dedicated 24/7 support team.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0000FF] group-hover:gap-2.5 transition-all duration-200">
                  Browse Marketplace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </RevealLeft>
      </div>
    </div>
  </Reveal>
</section>
            {/* ── TRUST / ESCROW SECTION ── */}
            <section className="bg-[#FAFAFA] border-t border-b border-gray-100 py-24 px-[5%]">
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <Reveal>
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 blur-3xl bg-blue-200/40 rounded-full scale-75 translate-y-8 pointer-events-none" />
                      <Image
                        src="/phone-gen-pic.png"
                        alt="Secure trading on Nepogames"
                        width={240}
                        height={400}
                        className="relative z-10"
                      />
                    </div>
                  </div>
                </Reveal>

                <Reveal>
                  <div>
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#0000FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                      Escrow Protection
                    </span>
                    <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-[#0a0a1a] leading-tight">
                      Trade with complete
                      <br />
                      <span className="text-[#0000FF]">peace of mind</span>
                    </h2>
                    <p className="mt-5 text-gray-500 leading-relaxed text-base max-w-md">
                      Every transaction is protected by our secure escrow
                      system, which safely holds funds until the account
                      transfer is fully verified. No scams, no chargebacks —
                      just clean trades.
                    </p>

                    <div className="mt-8 space-y-4">
                      {[
                        {
                          icon: Shield,
                          label: "Escrow-protected payments",
                          color: "text-blue-600 bg-blue-50",
                        },
                        {
                          icon: Zap,
                          label: "Instant delivery on confirmation",
                          color: "text-violet-600 bg-violet-50",
                        },
                        {
                          icon: Lock,
                          label: "Encrypted account transfers",
                          color: "text-emerald-600 bg-emerald-50",
                        },
                      ].map(({ icon: Icon, label, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
                          >
                            <Icon size={15} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10">
                      <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 bg-[#0000FF] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all duration-200 hover:gap-3 active:scale-95"
                      >
                        Browse marketplace
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>

            {/* ── STATS BENTO ── */}
            <section className="bg-white py-24 px-[5%]">
              <div className="max-w-6xl mx-auto">
                <Reveal>
                  <div className="flex justify-center mb-5">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#0000FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                      By the numbers
                    </span>
                  </div>
                  <h2 className="text-center text-3xl sm:text-4xl font-bold text-[#0a0a1a] mb-16">
                    The data behind our marketplace
                  </h2>
                </Reveal>

                <Reveal>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-2 bg-[#0000FF] rounded-2xl p-8 flex flex-col justify-between min-h-[180px]">
                      <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase">
                        Active users
                      </p>
                      <div>
                        <div className="text-white text-5xl font-bold tracking-tight">
                          <StatCard value={"100k+"} />
                        </div>
                        <p className="text-blue-200 text-sm mt-2">
                          verified traders on the platform
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAFA] border border-gray-100 rounded-2xl p-7 flex flex-col justify-between min-h-[180px]">
                      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
                        Games supported
                      </p>
                      <div>
                        <div className="text-[#0a0a1a] text-4xl font-bold tracking-tight">
                          <StatCard value={"10+"} />
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          popular titles
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAFA] border border-gray-100 rounded-2xl p-7 flex flex-col justify-between min-h-[180px]">
                      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
                        Avg. delivery
                      </p>
                      <div>
                        <div className="text-[#0a0a1a] text-4xl font-bold tracking-tight">
                          Fast
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          instant on confirmation
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAFA] border border-gray-100 rounded-2xl p-7 flex flex-col justify-between">
                      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
                        Security
                      </p>
                      <div>
                        <div className="text-[#0a0a1a] text-4xl font-bold tracking-tight">
                          100%
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          escrow protected
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAFA] border border-gray-100 rounded-2xl p-7 flex flex-col justify-between">
                      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
                        Satisfaction
                      </p>
                      <div>
                        <div className="text-[#0a0a1a] text-4xl font-bold tracking-tight">
                          4.9★
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          avg. user rating
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 bg-[#0a0a1a] rounded-2xl p-8 flex flex-col justify-between min-h-[160px]">
                      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
                        Platform uptime
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-white text-4xl font-bold tracking-tight">
                            99.9%
                          </div>
                          <p className="text-gray-500 text-sm mt-2">
                            always trading, always live
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mb-2" />
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="mt-10 flex justify-center">
                    <Image
                      src="/group.png"
                      alt=""
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto px-[5%] sm:px-[15%] lg:px-[25%] opacity-90"
                    />
                  </div>
                </Reveal>
              </div>
            </section>

            {/* ── REVIEWS SECTION ── */}
            <section className="bg-[#FAFAFA] border-t border-gray-100 py-24 px-[5%]">
              <div className="max-w-6xl mx-auto">
                <Reveal>
                  <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div className="md:sticky md:top-28">
                      <span className="text-xs font-semibold tracking-widest uppercase text-[#0000FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                        User reviews
                      </span>
                      <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-[#0a0a1a] leading-tight">
                        What our traders
                        <br />
                        <span className="text-[#0000FF]">actually say</span>
                      </h2>
                      <p className="mt-4 text-gray-500 leading-relaxed text-base max-w-sm">
                        Real feedback from buyers and sellers across the
                        platform — unfiltered and honest.
                      </p>

                      <div className="mt-8 inline-flex flex-col gap-1 bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-sm">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold text-[#0a0a1a]">
                            <StatCard value={"100k+"} />
                          </span>
                          <span className="text-gray-400 text-sm">
                            active users
                          </span>
                        </div>
                        <div className="mt-3">
                          <Image
                            src="/user-list.png"
                            alt=""
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Reviews />
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="scroll-mt-24 bg-white py-24 px-[5%]">
              <div className="max-w-6xl mx-auto">
                <Reveal>
                  <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
                    <div className="lg:sticky lg:top-28">
                      <span className="text-xs font-semibold tracking-widest uppercase text-[#0000FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                        FAQ
                      </span>
                      <h2 className="mt-5 text-3xl sm:text-4xl font-bold text-[#0a0a1a] leading-tight">
                        Frequently asked
                        <br />
                        questions
                      </h2>
                      <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-xs">
                        Everything you need to know about Nepo Games and how the
                        marketplace works.
                      </p>
                      <Link
                        href="/contact"
                        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0000FF] hover:gap-3 transition-all duration-200"
                      >
                        Still have questions? Contact us
                        <ArrowRight size={15} />
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                            activeIndex === index
                              ? "border-blue-200 shadow-sm"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full flex justify-between items-center px-6 py-5 text-left bg-white"
                          >
                            <span
                              className={`font-semibold text-sm pr-4 leading-snug ${activeIndex === index ? "text-[#0000FF]" : "text-[#0a0a1a]"}`}
                            >
                              {faq.question}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${activeIndex === index ? "bg-blue-50" : "bg-gray-50"}`}
                            >
                              <ChevronDown
                                size={15}
                                className={`transition-transform duration-300 ${
                                  activeIndex === index
                                    ? "rotate-180 text-[#0000FF]"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                          </button>
                          {activeIndex === index && (
                            <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed bg-white border-t border-gray-50">
                              <div className="pt-4">{faq.reply}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>

            {/* ── NEWSLETTER + FOOTER ── */}
            <section className="bg-[#0a0a1a] w-full">
              <Reveal>
                <div className="max-w-6xl mx-auto px-5 py-24 text-center">
                  <span className="text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-900/30 px-4 py-1.5 rounded-full border border-blue-800/40">
                    Stay in the loop
                  </span>
                  <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                    Get the{" "}
                    <span className="font-serif italic font-normal text-blue-400">
                      latest
                    </span>{" "}
                    updates
                  </h2>
                  <p className="mt-4 text-gray-400 text-base max-w-md mx-auto leading-relaxed">
                    New listings, platform news, and exclusive drops — delivered
                    straight to your inbox.
                  </p>

                  <div className="mt-10 w-full max-w-lg mx-auto">
                    {subscribed ? (
                      <div className="flex items-center justify-center gap-2 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 py-4 px-6 rounded-2xl text-sm font-medium">
                        <CheckCircle2 size={16} />
                        You're subscribed — we'll be in touch.
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSubscribe()
                          }
                          placeholder="your@email.com"
                          className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3.5 pl-5 pr-4 outline-none text-white placeholder-gray-600 focus:border-blue-500 transition-colors duration-200 text-sm"
                        />
                        <button
                          onClick={handleSubscribe}
                          className="px-6 py-3.5 rounded-xl bg-[#0000FF] text-white text-sm font-semibold hover:bg-blue-600 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                        >
                          Subscribe
                        </button>
                      </div>
                    )}
                    <p className="mt-3 text-gray-600 text-xs">
                      No spam. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </Reveal>

              <div className="w-full h-px bg-white/5"></div>

              <Reveal>
                <Footer />
              </Reveal>

              <div className="w-full h-px bg-white/5"></div>

              <Reveal>
                <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <span>
                    © {new Date().getFullYear()} Nepo Games · All rights
                    reserved
                  </span>
                  <div className="flex gap-5">
                    <span>
                      Designed by{" "}
                      <a
                        href=""
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200 font-semibold"
                      >
                        Faiq
                      </a>
                    </span>
                    <span>
                      Developed by{" "}
                      <a
                        href="http://modred.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200 font-semibold"
                      >
                        Modred
                      </a>
                    </span>
                  </div>
                </div>
              </Reveal>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton({ fading = false }) {
  return (
    <div className="page-fadein">
      <div className="min-h-screen bg-white overflow-hidden">
        <div className="w-full px-[5%] mt-7">
          <div className="px-[2%] border border-[#7A7AFE]/50 rounded-4xl bg-white/95">
            <div className="flex md:grid grid-cols-3 justify-between py-2 md:py-3 items-center w-full">
              <div className="w-9 h-9 rounded-full bg-gray-200 shimmer" />
              <div className="hidden md:flex justify-center gap-9">
                <div className="h-[14px] w-[90px] rounded-full bg-gray-200 shimmer" />
                <div
                  className="h-[14px] w-[56px] rounded-full bg-gray-200 shimmer"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="h-[14px] w-[68px] rounded-full bg-gray-200 shimmer"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <div className="hidden md:flex justify-end">
                <div className="flex border border-blue-200 rounded-2xl overflow-hidden">
                  <div
                    className="w-[76px] h-9 bg-blue-50 shimmer"
                    style={{ borderRadius: 0 }}
                  />
                  <div
                    className="w-[76px] h-9 bg-blue-200 shimmer"
                    style={{ borderRadius: 0, animationDelay: "0.15s" }}
                  />
                </div>
              </div>
              <div className="md:hidden w-4 h-[14px] rounded bg-gray-200 shimmer mr-3" />
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center gap-4 text-center px-[2%] bg-white"
          style={{ paddingTop: 180, paddingBottom: 0 }}
        >
          <div className="flex items-center gap-2 bg-[#0000FF]/10 px-3 py-[5px] rounded-2xl">
            <div className="w-5 h-5 rounded-full bg-blue-200 shimmer" />
            <div
              className="h-[13px] w-[158px] rounded-full bg-blue-200 shimmer"
              style={{ animationDelay: "0.1s" }}
            />
          </div>
          <div
            className="shimmer"
            style={{ width: "min(700px, 92%)", height: 52, borderRadius: 10 }}
          />
          <div
            className="shimmer"
            style={{
              width: 280,
              height: 52,
              borderRadius: 10,
              animationDelay: "0.1s",
            }}
          />
          <div
            className="flex flex-col items-center gap-2 w-full"
            style={{ maxWidth: 460 }}
          >
            <div
              className="shimmer"
              style={{ width: "100%", height: 14, animationDelay: "0.15s" }}
            />
            <div
              className="shimmer"
              style={{ width: "78%", height: 14, animationDelay: "0.2s" }}
            />
          </div>
          <div
            className="shimmer"
            style={{ width: 196, height: 14, animationDelay: "0.25s" }}
          />
          <div
            className="shimmer"
            style={{
              width: "min(660px, 100%)",
              height: 370,
              borderRadius: "16px 16px 0 0",
              marginTop: 16,
              animationDelay: "0.1s",
            }}
          />
        </div>
        <div
          style={{
            background: "linear-gradient(to right, #5dacec, #9750f6)",
            height: 110,
            display: "flex",
            alignItems: "center",
            gap: 32,
            padding: "0 24px",
            overflow: "hidden",
          }}
        >
          {[130, 120, 140, 110, 150, 130, 120, 140, 130].map((w, i) => (
            <div
              key={i}
              className="shimmer-light"
              style={{
                width: w,
                height: 80,
                borderRadius: 8,
                flexShrink: 0,
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-center mt-5 mb-7 pt-5 px-3">
          <div
            className="shimmer"
            style={{ width: "min(460px, 85%)", height: 48, borderRadius: 10 }}
          />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-10 px-[5%]">
          {[
            { lw: 76, d: [0, 0.05, 0.1] },
            { lw: 108, d: [0.08, 0.13, 0.18] },
            { lw: 88, d: [0.16, 0.21, 0.26] },
            { lw: 100, d: [0.24, 0.29, 0.34] },
          ].map(({ lw, d }, i) => (
            <div
              key={i}
              style={{
                background:
                  "linear-gradient(to bottom, rgba(79,140,255,0.2), rgba(138,56,245,0.2))",
                borderRadius: 16,
                padding: "28px 28px 0",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 380,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="shimmer"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    flexShrink: 0,
                    animationDelay: `${d[0]}s`,
                  }}
                />
                <div
                  className="shimmer"
                  style={{
                    width: lw,
                    height: 24,
                    borderRadius: 9999,
                    animationDelay: `${d[0] + 0.05}s`,
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  className="shimmer"
                  style={{
                    width: "100%",
                    height: 13,
                    borderRadius: 9999,
                    animationDelay: `${d[1]}s`,
                  }}
                />
                <div
                  className="shimmer"
                  style={{
                    width: "88%",
                    height: 13,
                    borderRadius: 9999,
                    animationDelay: `${d[1] + 0.05}s`,
                  }}
                />
                <div
                  className="shimmer"
                  style={{
                    width: "72%",
                    height: 13,
                    borderRadius: 9999,
                    animationDelay: `${d[1] + 0.1}s`,
                  }}
                />
              </div>
              <div style={{ marginTop: "auto", padding: "0 16px" }}>
                <div
                  className="shimmer"
                  style={{
                    height: 160,
                    borderRadius: "16px 16px 0 0",
                    animationDelay: `${d[2]}s`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
