"use client";
import {
  X,
  Star,
  Store,
  BadgeDollarSign,
  Info,
  Headphones,
} from "lucide-react";
import Reveal from "./reveal";
import { useEffect, useRef, useState, useMemo } from "react";
import Reviews from "./review";
import Footer from "./footer";
import RevealRight from "./revealfright";
import RevealLeft from "./revealfrleft";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const innerRef = useRef(null);
  const [active, setActive] = useState("");
  const linkClass = (name) =>
    `flex items-center gap-3 px-4 py-3 w-full border-b transition-colors duration-200
   ${
     active === name
       ? "bg-blue-50 text-blue-700 border-blue-100 border-l-4 border-l-blue-600 font-semibold"
       : "bg-white text-gray-800 border-gray-100 hover:bg-gray-100"
   }`;
  const games = [
    {
      name: "Delta Force",
      logo: "/deltaforce_512.png",
    },
    {
      name: "Efootball",
      logo: "/efootball_512.png",
    },
    {
      name: "Mobile Legends",
      logo: "/mobile_legends_512.png",
    },
    {
      name: "Call Of Duty Mobile",
      logo: "/call_of_duty_512.png",
    },
    {
      name: "Fortnite",
      logo: "/fortnite_512.png",
    },
    {
      name: "Minecraft",
      logo: "/minecraft_512.png",
    },
    {
      name: "Pubg Mobile",
      logo: "/pubg_512.png",
    },
    {
      name: "Gameloft",
      logo: "/gameloft_512.png",
    },
    {
      name: "Free Fire",
      logo: "/freefire.png",
    },
    {
      name: "Blood Strike",
      logo: "/bloodstrike.png",
    },
  ];
  // Duplicate for seamless loop
  const items = useMemo(() => [...games, ...games], [games]);

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

      // Force one repaint for iOS
      el.style.transform = "translate3d(0,0,0)";
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight; // trigger reflow
      el.style.transform = "";

      setReady(true);
    };

    waitForImages();

    return () => {
      cancelled = true;
    };
  }, [items]);

  function parsePrettyNumber(input) {
    const raw = String(input).trim();

    const hasPlus = raw.endsWith("+");
    const noPlus = hasPlus ? raw.slice(0, -1) : raw;

    // Match: number + optional suffix (k/m/b) e.g. 100k, 1M, 2K
    const match = noPlus.match(/^(\d+(\.\d+)?)([kKmMbB])?$/);

    // Fallback: if it doesn't match, just treat as 0 and keep original string
    if (!match) {
      return { target: 0, suffix: "", plus: hasPlus, raw };
    }

    const num = Number(match[1]);
    const suffix = (match[3] || "").toUpperCase();

    const mult =
      suffix === "K"
        ? 1_000
        : suffix === "M"
          ? 1_000_000
          : suffix === "B"
            ? 1_000_000_000
            : 1;

    return { target: Math.round(num * mult), suffix, plus: hasPlus, raw };
  }

  function formatPrettyNumber(n, suffix, plus) {
    let display = "";

    if (suffix === "K") display = `${Math.round(n / 1_000)}K`;
    else if (suffix === "M") display = `${Math.round(n / 1_000_000)}M`;
    else if (suffix === "B") display = `${Math.round(n / 1_000_000_000)}B`;
    else display = `${Math.round(n)}`;

    return plus ? `${display}+` : display;
  }

  function StatCard({ iconSrc, value, label, className = "" }) {
    const cardRef = useRef(null);
    const startedRef = useRef(false);

    const { target, suffix, plus } = useMemo(
      () => parsePrettyNumber(value),
      [value],
    );

    const [displayValue, setDisplayValue] = useState(() =>
      // start from 0 but keep formatting style
      formatPrettyNumber(0, suffix, plus),
    );

    useEffect(() => {
      const el = cardRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          // Start ONLY when visible, and only once.
          if (!entry.isIntersecting || startedRef.current) return;
          startedRef.current = true;

          const duration = 2000; // ms
          const start = performance.now();

          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            // Smooth-ish easing
            const eased = 1 - Math.pow(1 - t, 3);

            const current = Math.round(eased * target);
            setDisplayValue(formatPrettyNumber(current, suffix, plus));

            if (t < 1) requestAnimationFrame(tick);
            else setDisplayValue(formatPrettyNumber(target, suffix, plus));
          };

          requestAnimationFrame(tick);
        },
        {
          threshold: 0.35, // triggers when ~35% of card is visible
        },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [target, suffix, plus]);

    return (
      <div
        ref={cardRef}
        className={[
          "w-[220px] h-[220px] rounded-2xl",
          "bg-gradient-to-b from-[#4F8CFF] to-[#2A2AB8]",
          "shadow-[0_18px_40px_rgba(0,60,255,0.35)]",
          "flex flex-col items-center justify-center text-white",
          "relative overflow-hidden",
          className,
        ].join(" ")}
      >
        {/* subtle top glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/15 blur-2xl" />

        <img
          src={iconSrc}
          alt=""
          className="h-20 w-20 object-contain mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
        />

        <div className="text-4xl font-extrabold leading-none tabular-nums">
          {displayValue}
        </div>
        <div className="text-sm font-semibold opacity-95">{label}</div>
      </div>
    );
  }

  const steps = [
    {
      title: "EXPLORE",
      text: "Browse thousands of handpicked accounts. Filter by rare skins, peak rank or specific legacy items across your favorite titles.",
      icon: "/analyze.png",
    },
    {
      title: "VERIFY",
      text: "Check detailed sellers ratings and accounts screenshots. Our system pulls live data to ensure the rank and inventory match the listing.",
      icon: "/verify.png",
    },
    {
      title: "SECURE",
      text: "Pay with confidence. Your funds are held in Escrow; the seller doesn’t get a dime until you have the login.",
      icon: "/lock.png",
    },
    {
      title: "UNLOCK",
      text: "Once payment is confirmed, the account credentials (email and password) are automatically released to your dashboard.",
      icon: "/unlock.png",
    },
    {
      title: "PLAY",
      text: "Safe. Secure. Fast",
      icon: "/game.png",
    },
  ];

  const scrollerRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerInner = scroller.querySelector(".scroller_inner");
    if (!scrollerInner) return;

    // prevent duplicating again on re-render / fast refresh
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
      <div className="w-full bg-white/80 backdrop-blur-2xl fixed z-100">
        <Reveal>
          <header className="relative">
            <div className="px-6 lg:px-15 border-b border-gray-300">
              {/* DESKTOP NAV */}
              <div className="hidden lg:flex py-4 font-semibold items-center text-[#808080] justify-between w-full">
                <div className="text-black font-bold">Nepo Games</div>

                <div className="flex gap-9">
                  <a
                    href=""
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
                  </a>
                  <a
                    href=""
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
                  </a>
                  <a
                    href=""
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
                    About Us
                  </a>
                  <a
                    href=""
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
                    Support
                  </a>
                </div>

                <div>
                  <button className="py-2 px-3 rounded-xl border mr-4 transition-all duration-500 hover:bg-gray-200/80">
                    Log In
                  </button>

                  <button className="py-2 px-3 rounded-xl transition-all  duration-500 hover:bg-blue-800 border border-blue-600 bg-[#0000FF] text-white font-bold">
                    Get Started
                  </button>
                </div>
              </div>

              {/* MOBILE NAV */}
              <div className="flex py-4 font-semibold lg:hidden items-center justify-between">
                <div className="text-black font-bold">Nepo Games</div>

                <button onClick={() => setOpen(!open)}>
                  <div className="group items-center flex flex-col gap-1 cursor-pointer">
                    <span className="w-6 h-0.75 bg-[#0000FF] rounded transition-all group-hover:w-6"></span>
                    <span className="w-4  h-0.75 bg-[#0000FF] rounded transition-all group-hover:w-8"></span>
                    <span className="w-6  h-0.75 bg-[#0000FF] rounded transition-all group-hover:w-6"></span>
                  </div>{" "}
                </button>
              </div>
            </div>

            {/* MOBILE SIDEBAR */}
          </header>
        </Reveal>
      </div>
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-1050 transform transition-transform duration-300

       
         ${open ? "translate-x-0" : "translate-x-full"}
        
        `}
      >
        <div className="p-6 pt-5.25 h-full flex flex-col justify-between">
          <div className="flex justify-between">
            <p className="font-bold">Nepo</p>
            <button onClick={() => setOpen(false)} className="mb-2.5 -mt-1">
              <X size={30} className="text-[#0000FF] font-bold" />
            </button>
          </div>

          <div className="bg-[#0000FF]/50 h-[0.5] -mx-6"></div>

          <div className="flex  text-[#262626]  flex-col gap-6 h-full text-lg font-semibold">
            <div className="flex flex-col -mx-6">
              <button
                onClick={() => setActive("Marketplace")}
                className={linkClass("Marketplace")}
              >
                <Store size={20} />
                Marketplace
              </button>

              <button
                onClick={() => setActive("Pricing")}
                className={linkClass("Pricing")}
              >
                <BadgeDollarSign size={20} />
                Pricing
              </button>

              <button
                onClick={() => setActive("About Us")}
                className={linkClass("About Us")}
              >
                <Info size={20} />
                About Us
              </button>

              <button
                onClick={() => setActive("Support")}
                className={linkClass("Support")}
              >
                <Headphones size={20} />
                Support
              </button>
            </div>
            <div className="flex flex-col gap-6 mb-2.5 mt-auto">
              <button
                className="
      py-2 px-3 rounded-xl border
      transition-colors duration-300
      bg-gray-100
      hover:bg-gray-300/90
      active:bg-gray-300/90
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    "
              >
                Log In
              </button>

              <button
                className="
      py-2 px-3 rounded-xl border border-blue-600
      bg-[#0000FF] text-white font-bold
      transition-colors duration-300
      hover:bg-blue-800
      active:bg-blue-800
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    "
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )}
      <main>
        <Reveal>
          <div className="grid grid-cols-1 pt-20 lg:grid-cols-2 pb-10 gap-3">
            <div className="font-bold px-10 ">
              <h1 className="pt-15 text-center lg:text-start font-bold leading-[1.05] hidden sm:block text-[clamp(4rem,5.4vw,5.6rem)]">
                The Premium{" "}
                <span className="text-[#0000FF]">Gaming Account</span>{" "}
                Marketplace
              </h1>
              <h1 className="pt-15 text-center lg:text-start font-bold leading-[1.05] sm:hidden block text-[clamp(2rem,5.4vw,5.6rem)]">
                The Premium{" "}
                <span className="text-[#0000FF]">Gaming Account</span>{" "}
                Marketplace
              </h1>
              <p className="pt-7 text-center font-medium text-gray-500 text-[clamp(1.3rem,1.9vw,1.6rem)]">
                Redefining how premium gaming accounts are traded — securely and
                transparently. Skip the grind.{" "}
                <span className="font-bold text-[#0000FF] italic">
                  Trade with confidence.
                </span>
              </p>
              <div className="w-full grid lg:justify-start justify-center">
                <div className="pt-10 grid grid-cols-2 gap-2   max-w-120">
                  <div className="flex justify-center">
                    <button className=" rounded-2xl py-3 px-6 sm:py-5 sm:px-8 hover:bg-blue-800 border border-blue-600/90 duration-500 transition-all sm:text-lg text-sm bg-[#0000FF] text-white font-semibold">
                      Buy Account
                    </button>
                  </div>
                  <div className="flex justify-center">
                    {" "}
                    <button className="py-3 px-3 sm:py-5 sm:px-5 rounded-2xl border mr-2 hover:bg-gray-200/50 bg-white  duration-500 transition-all  sm:text-lg text-sm">
                      Sell your account
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className=" sm:px-20  p-10">
              <img src="/nepo-market.png" className="" alt="" />
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="scroller bg-[#0000FF]">
            <div
              ref={innerRef}
              className={`scroller_inner ${ready ? "is-ready" : ""}`}
            >
              {items.map((game, i) => (
                <div key={`${game.name}-${i}`} className="logoWrap">
                  <img
                    src={game.logo}
                    alt={game.name}
                    className="logoImg"
                    draggable="false"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div>
            <div className="grid w-full justify-center items-center ">
              <p className=" bg-linear-to-r gap-4 hover:scale-[1.03] active:scale-[0.98] transition-transform from-[#3B82F6] to-[#1E3A8A] shadow-md border border-blue-100 shadow-blue-400 mt-10 text-[#FFFFFF] justify-center items-center flex  text-xl sm:text-3xl  rounded-full py-5 px-10">
                <Star className="fill-white "></Star>
                <span className="font-bold">Features</span>
              </p>
            </div>
            <p className="text-[#0000FF] px-3 font-bold text-3xl text-center lg:text-5xl pt-5 flex w-full justify-center">
              All Your Games. One Secure Marketplace
            </p>
            <div className="w-full flex pt-4 items-center justify-center">
              <p className="text-base sm:text-xl lg:text-2xl text-center text-gray-900 max-w-300 px-3 pb-7">
                Built for serious gamers, Nepo Games provides escrow protection,
                verified sellers, and seamless transfers — so every trade is
                smooth, safe, and guaranteed.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 text-sm sm:text-base lg:text-xl text-center gap-4 px-5 lg:px-10 ">
              <div className="group rounded-2xl pb-10 bg-[#FBF6F6] px-2 border shadow-blue-900 shadow-sm border-blue-100 hover:border-blue-700 transition-all duration-700">
                <div className="p-15 pb-5">
                  {" "}
                  <div className="w-full h-50 sm:h-70 overflow-hidden rounded-3xl">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                      src="/transact.jpg"
                      alt=""
                    />
                  </div>
                </div>
                <p className="font-bold transition-all duration-500 group-hover:text-blue-700">
                  Escrow-Protected Payments
                </p>
                <p>
                  Every transaction on our platform is secured with escrow
                  protection. The buyer’s funds are safely held until the
                  account transfer is fully completed and verified. This ensures
                  both parties are protected and eliminates the risk of scams or
                  chargebacks. Trade with complete confidence knowing your money
                  is always safe.
                </p>
              </div>
              <div className="group rounded-2xl pb-10 bg-[#FBF6F6] px-2 border shadow-blue-900 shadow-sm border-blue-100 hover:border-blue-700 transition-all duration-700">
                <div className="p-15 pb-5">
                  {" "}
                  <div className="w-full  h-50 sm:h-70 overflow-hidden rounded-3xl">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                      src="/google.jpg"
                      alt=""
                    />
                  </div>
                </div>

                <p className="font-bold transition-all duration-500 group-hover:text-blue-700">
                  Advanced Search & Smart Filters
                </p>
                <p>
                  Find exactly what you’re looking for in seconds. Filter
                  accounts by game title, rank, skins, price range, platform,
                  and more. Our smart filtering system makes it easy to compare
                  listings and discover the best deals without wasting time.
                </p>
              </div>
              <div className="group rounded-2xl pb-10 bg-[#FBF6F6] shadow-blue-900 shadow-sm px-2 border border-blue-100 hover:border-blue-700 transition-all duration-700">
                <div className="p-15 pb-5">
                  {" "}
                  <div className="w-full  h-50 sm:h-70 overflow-hidden rounded-3xl">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                      src="message.jpg"
                      alt=""
                    />
                  </div>
                </div>

                <p className="font-bold transition-all duration-500 group-hover:text-blue-700">
                  Secure In-Platform Messaging
                </p>
                <p>
                  Communicate directly with sellers through our secure in-app
                  messaging system. Share details, confirm requirements, and
                  track conversations safely within the platform. This keeps all
                  transactions organized and transparent.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="pt-10">
            <div className="relative mx-auto w-full max-w-250 overflow-hidden rounded-3xl">
              {/* MOBILE LAYOUT */}
              <div className="flex flex-col items-center gap-6 p-6 md:hidden">
                {/* Stats first */}
                <button
                  className={[
                    "flex items-center gap-3 rounded-full px-6 py-3 text-xl sm:text-3xl",
                    "bg-linear-to-r from-[#3B82F6] to-[#1E3A8A] text-white font-bold",
                    "shadow-md backdrop-blur-md border border-blue-100 shadow-blue-400",
                    "hover:scale-[1.03] active:scale-[0.98] transition-transform",
                  ].join(" ")}
                >
                  <Star className="fill-white"></Star>
                  Stats
                </button>

                {/* Stat cards after */}

                <div className="w-full flex justify-center">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 place-items-center w-full">
                    <StatCard
                      iconSrc="link.png"
                      value="987+"
                      label="Account Sold"
                    />
                    <StatCard
                      iconSrc="person.png"
                      value="100k+"
                      label="Active Users"
                    />
                    <StatCard
                      iconSrc="money.png"
                      value="10M+"
                      label="Money Traded"
                    />
                    <StatCard
                      iconSrc="book.png"
                      value="20K+"
                      label="Account Listed"
                    />
                  </div>
                </div>
              </div>

              {/* DESKTOP/TABLET LAYOUT */}
              <div className="hidden min-h-162.5 md:block">
                {/* TOP */}
                <div className="absolute left-1/2 top-10 -translate-x-1/2">
                  <StatCard
                    iconSrc="link.png"
                    value="987+"
                    label="Account Sold"
                  />
                </div>

                {/* LEFT */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2">
                  <StatCard
                    iconSrc="person.png"
                    value="100k+"
                    label="Active Users"
                  />
                </div>

                {/* RIGHT */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <StatCard
                    iconSrc="money.png"
                    value="10M+"
                    label="Money Traded"
                  />
                </div>

                {/* BOTTOM */}
                <div className="absolute left-1/2 bottom-10 -translate-x-1/2">
                  <StatCard
                    iconSrc="book.png"
                    value="20K+"
                    label="Account Listed"
                  />
                </div>

                {/* CENTER PILL */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <button
                    className={[
                      "flex items-center gap-3 rounded-full px-6 py-3  text-xl sm:text-3xl ",
                      "bg-linear-to-r from-[#3B82F6] to-[#1E3A8A] text-white font-bold",
                      "shadow-md backdrop-blur-md border border-blue-100 shadow-blue-400",
                      "hover:scale-[1.03] active:scale-[0.98] transition-transform",
                    ].join(" ")}
                  >
                    <Star className="fill-white"></Star>
                    Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="pt-30 pb-20 flex justify-center">
            <div className="w-full max-w-5xl px-4 sm:px-8">
              {/* wrapper */}
              <div className="relative flex flex-col items-center">
                {/* CENTER LINE */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-[2px] bg-[#8A38F5]" />

                {/* STEPS */}
                <div className="flex flex-col gap-14 w-full items-center">
                  {steps.map((s, idx) => (
                    <div
                      key={s.title}
                      className="relative flex flex-col items-center text-center"
                    >
                      <RevealRight>
                        {/* ICON */}
                        <div className="relative z-10 bg-gradient-to-b from-[#4B6BC6] to-[#2626A6] w-25 h-25 md:w-30 md:h-30 p-6 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
                          <img
                            src={s.icon}
                            alt={s.title}
                            className="invert w-full h-full object-contain"
                          />
                        </div>
                      </RevealRight>
                      {/* CARD */}
                      <RevealLeft>
                        <div className="mt-6 max-w-[520px] text-base sm:text-lg md:text-xl text-[#0000FF] border border-[#8A38F5] rounded-2xl md:py-6 md:px-6 py-5 px-4 bg-[#C1C8F5] shadow-[0_12px_40px_rgba(138,56,245,0.12)]">
                          <p className="font-bold tracking-wide">{s.title}</p>
                          <p className="mt-2 text-[#0000FF]/90">{s.text}</p>
                        </div>
                      </RevealLeft>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="bg-white">
          {" "}
          <Reveal>
            <div className="grid pt-6 w-full justify-center items-center ">
              <p className=" bg-linear-to-r gap-4 hover:scale-[1.03] active:scale-[0.98] transition-transform from-[#3B82F6] to-[#1E3A8A] shadow-md border border-blue-100 shadow-blue-400 mt-10 text-[#FFFFFF] justify-center items-center flex text-xl sm:text-3xl  rounded-full py-5 px-10">
                <Star className="fill-white"></Star>
                <span className="font-bold">Reviews</span>
              </p>
            </div>
            <div className="pb-20 p-10 pr-8">
              <Reviews />
            </div>
          </Reveal>{" "}
        </div>

        <section className="w-full bg-[url('/footer.png')] bg-cover bg-center bg-no-repeat">
          <Reveal>
            {" "}
            <div className="max-w-7xl mx-auto px-5 text-white text-center">
              <div className="py-24 flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                  Get the{" "}
                  <span className="font-serif italic font-normal">Latest</span>{" "}
                  Updates
                </h2>

                <p className="mt-4 max-w-xl text-white/90 text-lg">
                  Receive the latest news, insights and exclusive content
                  directly in your inbox.
                </p>

                <div className="mt-10 w-full max-w-2xl relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="
              w-full
              rounded-full
              bg-transparent
              border
              border-white/50
              py-5
              pl-6
              pr-40
              outline-none
              text-white
              placeholder-white/60
            "
                  />

                  <button
                    className="
              absolute
              right-2
              top-1/2
              -translate-y-1/2
              px-5
              py-3
              text-sm
              sm:text-base
              rounded-full
              bg-gradient-to-r
              from-[#3B82F6]
              to-[#000099]
              border
              border-white/60
              font-semibold
              hover:scale-105
              transition
            "
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"></div>
            <Footer />
            <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-5 pt-12 pb-6 text-white/70 text-sm text-center">
              © {new Date().getFullYear()} Nepo Games. All rights reserved.
            </div>
            <div className="grid grid-cols-2 pb-5">
              <div className="max-w-7xl mx-auto pb-3 px-5 text-white/40 text-sm text-center">
                Designed by{" "}
                <a
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
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

    font-bold
  "
                >
                  Faiq
                </a>
              </div>
              <div className="max-w-7xl mx-auto pb-3 px-5 text-white/40 text-sm text-center">
                Developed by{" "}
                <a
                  href="http://modred.dev"
                  target="_blank"
                  rel="noopener noreferrer"
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
    font-bold

    hover:after:origin-left
    hover:after:scale-x-100
  "
                >
                  Modred
                </a>
              </div>
            </div>
          </Reveal>{" "}
        </section>
      </main>
    </div>
  );
}
