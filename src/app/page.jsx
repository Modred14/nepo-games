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
  Menu,
} from "lucide-react";
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
        setFading(true); // trigger skeleton fade-out
        setTimeout(() => setLoad(false), 300);
      }
    };

    fetchUser();
  }, []);
  const router = useRouter();
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

  const handleLogout = async () => {
    localStorage.removeItem("nepo-user");

    await signOut({
      callbackUrl: "/login", // where to go after logout
    });
  };
  const linkClass = () =>
    `flex items-center gap-3 px-4 py-3 w-full border-b transition-colors duration-200
    "bg-white text-gray-800 border-gray-400/20 hover:bg-gray-100"
   `;
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

  function StatCard({ value }) {
    const cardRef = useRef(null);
    const startedRef = useRef(false);

    const [displayValue, setDisplayValue] = useState(0);

    // parse "100k+" -> { number:100, suffix:"k", plus:"+" }
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

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

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

  // const [loader, setLoader] = useState(true);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setLoad(false);
  //   }, 600000); // 10 minutes in milliseconds
  // }, []);

  // if (load) {
  //    return <HomeSkeleton fading={fading} />;
  // }

  if (load) {
    return <Loader />;
  }

  return (
    <div>
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
      <div className="min-h-screen bg-linear-to-b">
        <div>
          <div className="w-full px-[5%] mt-5 bg-transparent fixed z-100">
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
                            {/* Sign In */}
                            <Link
                              href={"/login"}
                              className="px-4 py-2 pr-5 hover:bg-blue-50 -mr-2"
                            >
                              Sign In
                            </Link>

                            {/* Sign Up */}
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

                              {/* Dropdown */}
                              {refOpen && (
                                <div className="cursor-pointer">
                                  {" "}
                                  <div className="absolute  right-0 mt-1 bg-white/95  backdrop-blur-md border  border-[#7A7AFE]/50 shadow-sm rounded-sm z-50 overflow-hidden transition-all duration-200">
                                    {/* Profile */}
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
                                    {/* Divider */}
                                    <div className="h-px bg-gray-200 mx-2"></div>
                                    {/* Logout */}
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
          </div>

          {/* BACKDROP */}
          {open && (
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
          )}
          <main>
            {" "}
            <div className="bg-linear-to-b h-full mb-10 rounded-b-4xl from-[#FFFFFF] to-[#8080FF]">
              <Reveal>
                <div className="pt-45 px-[2%]">
                  <div className="justify-center flex">
                    <div className="bg-white flex justify-center items-center gap-2 p-1 px-3 rounded-2xl">
                      <img
                        src="/logo.png"
                        alt="Nepo Games"
                        className="w-5 h-5 p-1 rounded-[50%] bg-blue-700 object-cover"
                      />
                      <p className="text-[#0000FF]">Best Gaming Marketplace</p>
                    </div>{" "}
                  </div>
                  <div className="text-center pt-5 text-5xl">
                    <p>Trade your Gaming Accounts with</p>
                    <p className="text-white sm:pt-3">Nepogames</p>
                  </div>
                  <div className="hidden md:flex relative">
                    {/* floating tags */}
                    <div className="absolute left-0 right-0 -top-5 flex justify-center pointer-events-none">
                      <div className="flex justify-between max-w-3xl w-full px-[1%]">
                        <div className="w-fit">
                          <div className="relative">
                            <div className="absolute -top-4.5 left-22 w-3 h-3 border-l-4 border-t-4 border-blue-700 rotate-90"></div>

                            <div className="rotate-[45deg] bg-linear-to-r from-purple-600 to-blue-500 px-3 py-2 rounded-xl border-2 border-blue-800 shadow-lg">
                              <p className="text-white text-sm font-semibold tracking-wide">
                                Nepogames
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-fit">
                          <div className="relative">
                            <div className="absolute -top-4.5 left-6 w-3 h-3 border-l-4 border-t-4 border-blue-700"></div>

                            <div className="rotate-[-45deg] bg-linear-to-r from-purple-600 to-blue-500 px-3 py-2 rounded-xl border-2 border-blue-800 shadow-lg">
                              <p className="text-white text-sm font-semibold tracking-wide">
                                Nepogames
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4 text-lg flex w-full justify-center">
                    <div className=" max-w-120">
                      <p className="text-[#1b1a1a]">
                        Redefining how premium gaming accounts are traded —
                        securely and transparently. Skip the grind.{" "}
                      </p>
                      <p className="font-bold italic text-[#0000FF]">
                        Trade with confidence.
                      </p>
                    </div>
                  </div>
                  <div className="justify-center flex">
                    <img src="/nepo-mark.png" alt="" />
                  </div>
                </div>
              </Reveal>{" "}
            </div>
            <Reveal>
              <div className="scroller bg-linear-to-r from-[#5DACEC] to-[#9750F6]">
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
            <div>
              {" "}
              <Reveal>
                <p className="text-[#0000FF] px-3 text-3xl mt-5 mb-7 text-center lg:text-5xl pt-5 flex w-full justify-center">
                  How our Marketplace Works
                </p>
              </Reveal>
              <div className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4 gap-10 px-[5%]  items-stretch">
                <RevealLeft>
                  <Link href={"/signup"}>
                    <div className="bg-linear-to-b h-full from-[#4F8CFF]/50 rounded-xl pb-0 p-7 shadow-md to-[#8A38F5]/50  transition-all duration-500">
                      <div className="flex gap-3 items-center">
                        <div className=" bg-white rounded-[50%] p-3">
                          <div className="border-[#6D62FA] rounded-[50%] border-3">
                            <User2Icon
                              size={25}
                              style={{ stroke: "url(#grad1)" }}
                            />
                            <svg width="0" height="0">
                              <defs>
                                <linearGradient
                                  id="grad1"
                                  x1="0%"
                                  y1="0%"
                                  x2="0%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#4F8CFF" />
                                  <stop offset="100%" stopColor="#8A38F5" />
                                </linearGradient>
                              </defs>
                            </svg>{" "}
                          </div>
                        </div>
                        <p className=" text-[22px] bg-linear-to-r to-[#0000FF] from-[#800080E0] bg-clip-text text-transparent">
                          Sign Up
                        </p>
                      </div>
                      <p className="text-[13px] p-2 pb-5 sm:h-22">
                        Register to access a protected marketplace built for
                        secure, transparent gaming account trading.
                      </p>
                      <div className="mt-auto xl:pt-4 px-5">
                        <img
                          src="/ex-sign.png"
                          className="rounded-t-2xl "
                          alt=""
                        />
                      </div>
                    </div>
                  </Link>
                </RevealLeft>
                <RevealRight>
                  <Link href="/sell-game">
                    <div className="bg-linear-to-b h-full from-[#4F8CFF]/50 rounded-xl pb-0 p-7 shadow-md to-[#8A38F5]/50  transition-all duration-500">
                      <div className="flex gap-3 items-center">
                        <div className=" bg-white rounded-[50%] p-3">
                          <div className="">
                            <Plus size={25} className="text-[#6D62FA] " />{" "}
                          </div>
                        </div>
                        <p className=" text-[22px] bg-linear-to-r to-[#0000FF] from-[#800080E0] bg-clip-text text-transparent">
                          Add Account
                        </p>
                      </div>
                      <p className="text-[13px] p-2 pb-5 sm:h-23.25 xl:h-[92.5px]">
                        Add games to sell and see potential buyers. Safe Fast
                        and Secure.
                      </p>
                      <div className="mt-auto xl:pt-4 px-5">
                        <img
                          src="/game-sign.png"
                          className="rounded-t-2xl "
                          alt=""
                        />
                      </div>
                    </div>
                  </Link>
                </RevealRight>
                <RevealLeft>
                  {" "}
                  <Link href={"/marketplace"}>
                    <div className="bg-linear-to-b h-full from-[#4F8CFF]/50 rounded-xl pb-0 p-7 shadow-md to-[#8A38F5]/50  transition-all duration-500">
                      <div className="flex gap-3 items-center">
                        <div className=" bg-white rounded-[50%] p-3">
                          <div>
                            <Tag size={25} style={{ stroke: "url(#grad1)" }} />
                            <svg width="0" height="0">
                              <defs>
                                <linearGradient
                                  id="grad1"
                                  x1="0%"
                                  y1="0%"
                                  x2="0%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#4F8CFF" />
                                  <stop offset="100%" stopColor="#8A38F5" />
                                </linearGradient>
                              </defs>
                            </svg>{" "}
                          </div>
                        </div>
                        <p className=" text-[22px] bg-linear-to-r to-[#0000FF] from-[#800080E0] bg-clip-text text-transparent">
                          Buy or Sell
                        </p>
                      </div>
                      <p className="text-[13px] p-2 pb-5 sm:h-23.25 xl:h-[92.5px]">
                        List your gaming account in minutes, connect with
                        serious buyers, and receive secure payouts with zero
                        hassle.
                      </p>
                      <div className="mt-auto xl:pt-4 px-5">
                        <img
                          src="/buy-sign.png"
                          className="rounded-t-2xl "
                          alt=""
                        />
                      </div>
                    </div>
                  </Link>
                </RevealLeft>{" "}
                <RevealRight>
                  <Link href={`/c/1?receiver_id=1`}>
                    <div className="bg-linear-to-b h-full from-[#4F8CFF]/50 rounded-xl pb-0 p-7 shadow-md to-[#8A38F5]/50  transition-all duration-500">
                      <div className="flex gap-3 items-center">
                        <div className=" bg-white rounded-[50%] p-3">
                          <div>
                            <SlidersHorizontal
                              size={25}
                              className="text-[#6D62FA]"
                            />
                          </div>
                        </div>
                        <p className=" text-[22px] bg-linear-to-r to-[#0000FF] from-[#800080E0] bg-clip-text text-transparent">
                          Control Trade
                        </p>
                      </div>
                      <p className="text-[13px] p-2 pb-5 sm:h-23.25 xl:h-[92.5px]">
                        Track, manage, and monitor every transaction in real
                        time with complete transparency and security..
                      </p>
                      <div className="mt-auto xl:pt-4 px-5">
                        <img
                          src="/page-sign.png"
                          className="rounded-t-2xl "
                          alt=""
                        />
                      </div>
                    </div>
                  </Link>
                </RevealRight>
              </div>
            </div>
            <div className="from-[#8A38F5]/50 to-[#4F8CFF]/50 bg-linear-to-b w-full mt-15 flex justify-center">
              <div className="grid md:grid-cols-2 items-center max-w-6xl pb-10 px-[5%]  ">
                <Reveal>
                  <div className="w-full flex justify-center">
                    <img src="/phone.png" alt="" />
                  </div>
                </Reveal>
                <Reveal>
                  <div>
                    <p className="text-4xl">
                      Trade Securely with
                      <span className="text-white"> Nepogames</span>
                    </p>
                    <p className="pt-5 md:pt-10">
                      Buy and sell gaming accounts with complete confidence on
                      NepoGames. Every transaction is protected by our secure
                      escrow system, which safely holds the buyer’s funds until
                      the account transfer is fully completed and verified. This
                      ensures that both buyers and sellers are protected from
                      scams, fraud, or chargebacks. Whether you’re looking to
                      sell your account quickly or find rare accounts to buy,
                      NepoGames makes trading safe, simple, and reliable, giving
                      you peace of mind every step of the way.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
            <Reveal>
              <p className="bg-linear-to-b from-[#4F8CFF] to-[#8A38F5] bg-clip-text text-transparent px-3 text-3xl mt-5 mb-7 text-center lg:text-5xl pt-5 flex w-full justify-center">
                The Data Driving Our Gaming Economy
              </p>
            </Reveal>
            <Reveal>
              <div>
                <img
                  src="/group.png"
                  className="px-[10%] sm:px-[15%] lg:px-[20%]"
                  alt=""
                />
              </div>
            </Reveal>
            <div className="bg-white">
              {" "}
              <div className="from-[#8A38F5]/50 px-[5%] mt-15  to-[#4F8CFF]/50 bg-linear-to-b w-full">
                <Reveal>
                  <div className="  grid md:grid-cols-2">
                    <div className="py-15 h-full gap-6 flex flex-col justify-between ">
                      <p className="text-white font-bold text-3xl">
                        What Our Users Are Saying About{" "}
                        <span className="text-[#402BBA]"> Nepo Games</span>
                      </p>
                      <p className="text-white md:mb-0 -mb-15">
                        At Nepo Games, player satisfaction is our top priority.
                        Here’s what real users have to say about their buying
                        and selling experience on our platform. From secure
                        transactions to fast delivery, their feedback reflects
                        the trust and reliability we strive to maintain.
                      </p>
                      <div className="md:flex hidden px-[10%]">
                        <div className="p-3 rounded-2xl pb-0 bg-linear-to-b from-[#4F8CFF] to-[#8A38F5]">
                          <div className="flex gap-1.5 justify-center text-white text-xl pb-2">
                            <span>
                              {" "}
                              <StatCard value={"100k+"} />{" "}
                            </span>
                            Active Users{" "}
                          </div>

                          <div className="px-6 ">
                            <img
                              src="/user-list.png"
                              className="rounded-t-2xl"
                              alt=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>{" "}
                    <div className=" sm:px-10 md:px-0 lg:px-10 py-10 ">
                      <Reviews />
                    </div>
                    <div className="md:hidden px-[10%] pb-10">
                      <div className="p-3 rounded-2xl pb-0 bg-linear-to-b from-[#4F8CFF] to-[#8A38F5]">
                        <div className="flex gap-1.5 justify-center text-white text-xl pb-2">
                          <span>
                            {" "}
                            <StatCard value={"100k+"} />{" "}
                          </span>
                          Active Users{" "}
                        </div>
                        <div className="px-6 ">
                          <img
                            src="/user-list.png"
                            className="rounded-t-2xl"
                            alt=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>{" "}
              </div>{" "}
            </div>
            <div className="px-[5%]">
              <Reveal>
                <div className=" flex text-center justify-center pt-13">
                  <p className="font-bold sm:text-4xl text-3xl">
                    Frequently Asked
                    <span className="text-[#402BBA]"> Questions</span>
                  </p>
                </div>
                <div className="flex pt-3 justify-center text-center">
                  {" "}
                  <p>
                    Everything you need to know about Nepo Games and our
                    products
                  </p>
                </div>
              </Reveal>
              <Reveal>
                <div className="pt-10 pb-15">
                  <div className="space-y-4 max-w-xl mx-auto">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-linear-to-r from-[#8A38F5] to-[#4F8CFF] p-[2px]"
                      >
                        <div className="bg-white rounded-xl">
                          <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full flex justify-between items-center p-5 text-left"
                          >
                            <span className="font-medium text-lg">
                              {faq.question}
                            </span>

                            <ChevronDown
                              className={`transition-transform duration-300 ${
                                activeIndex === index ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {activeIndex === index && (
                            <div className="px-5 pb-5 text-gray-600">
                              {faq.reply}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
            <section className="w-full bg-linear-to-b from-[#4F8CFF] to-[#8A38F5]">
              <Reveal>
                {" "}
                <div className="max-w-7xl mx-auto px-5 text-white text-center">
                  <div className="py-24 flex flex-col items-center">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      Get the{" "}
                      <span className="font-serif italic font-normal">
                        Latest
                      </span>{" "}
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
                <div className="w-full h-px bg-linear-to-r from-transparent via-gray-100/20 to-transparent"></div>
                <Footer />
                <div className="w-full h-[0.5px] bg-linear-to-r from-transparent via-gray-100/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-5 pt-12 pb-6 text-white/70 text-sm text-center">
                  © {new Date().getFullYear()} Nepo Games · All rights reserved
                  · Built with care for the gaming community
                </div>
                <div className="grid grid-cols-2 pb-5">
                  <div className="max-w-7xl mx-auto pb-3 px-5 text-white/40 text-xs text-center">
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
                  <div className="max-w-7xl mx-auto pb-3 px-5 text-white/40 text-xs text-center">
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
      </div>
    </div>
  );
}
function HomeSkeleton({ fading = false }) {
  return (
    <div className="page-fadein">
      <div className="min-h-screen bg-white overflow-hidden">
        {/* ─────────────────────────────────────────
          NAVBAR
          px-[5%] mt-5 | inner px-[2%] rounded-4xl
          logo w-9 h-9 | links hidden md:flex gap-9
          auth: border rounded-2xl h-9
      ───────────────────────────────────────── */}
        <div className="w-full px-[5%] mt-7">
          <div className="px-[2%] border border-[#7A7AFE]/50 rounded-4xl bg-white/95">
            <div className="flex md:grid grid-cols-3 justify-between py-2 md:py-3 items-center w-full">
              {/* Logo */}
              <div className="w-9 h-9 rounded-full bg-gray-200 shimmer" />

              {/* Nav links */}
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

              {/* Auth buttons */}
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

              {/* Mobile hamburger */}
              <div className="md:hidden w-4 h-[14px] rounded bg-gray-200 shimmer mr-3" />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
          HERO SECTION
          from-[#FFFFFF] to-[#8080FF] rounded-b-4xl
          pt-45 (180px) px-[2%]
          nepo-mark.png: wide composite mockup
          ~full width, ~370px tall, NO bottom padding
          — image bleeds right into scroller
      ───────────────────────────────────────── */}
        <div
          className="rounded-b-4xl flex flex-col items-center gap-4 text-center px-[2%]"
          style={{
            background: "linear-gradient(to bottom, #ffffff, #8080ff)",
            paddingTop: 180,
            paddingBottom: 0,
          }}
        >
          {/* Badge */}
          <div className="flex items-center gap-2 bg-white px-3 py-[5px] rounded-2xl">
            <div className="w-5 h-5 rounded-full bg-gray-200 shimmer" />
            <div
              className="h-[13px] w-[158px] rounded-full bg-gray-200 shimmer"
              style={{ animationDelay: "0.1s" }}
            />
          </div>

          {/* Headline line 1 — text-5xl = 48px, single line "Trade your Gaming Accounts with" */}
          <div
            className="shimmer"
            style={{
              width: "min(700px, 92%)",
              height: 52,
              borderRadius: 10,
              background:
                "linear-gradient(90deg,#d1d5db 25%,#e9ebee 50%,#d1d5db 75%)",
              backgroundSize: "800px 100%",
              animationDelay: "0.05s",
            }}
          />

          {/* Headline line 2 — "Nepogames" in white/light */}
          <div
            className="shimmer-light"
            style={{
              width: 280,
              height: 52,
              borderRadius: 10,
              animationDelay: "0.1s",
            }}
          />

          {/* Sub paragraph — 2 lines */}
          <div
            className="flex flex-col items-center gap-2 w-full"
            style={{ maxWidth: 460 }}
          >
            <div
              className="shimmer-light shimmer-r"
              style={{ width: "100%", height: 14, animationDelay: "0.15s" }}
            />
            <div
              className="shimmer-light shimmer-r"
              style={{ width: "78%", height: 14, animationDelay: "0.2s" }}
            />
          </div>

          {/* "Trade with confidence." italic line */}
          <div
            className="shimmer-light shimmer-r"
            style={{ width: 196, height: 14, animationDelay: "0.25s" }}
          />

          {/* nepo-mark.png
            From screenshot: a wide composite of phone + floating cards
            Takes up ~full content width, ~370px tall
            Sits flush at bottom — no mb/pb so it bleeds into scroller */}
          <div
            className="shimmer-light"
            style={{
              width: "min(660px, 100%)",
              height: 370,
              borderRadius: "16px 16px 0 0",
              marginTop: 16,
              animationDelay: "0.1s",
            }}
          />
        </div>

        {/* ─────────────────────────────────────────
          LOGO SCROLLER
          from-[#5DACEC] to-[#9750F6]
          From screenshot: ~110px tall strip
          logos are large ~80px tall, various widths
      ───────────────────────────────────────── */}
        <div
          className="mt-5"
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
          {/* Widths from screenshot logos: Free Fire, Blood Strike, Delta Force, eFootball, Mobile Legends, CoD, Fortnite, Minecraft, PUBG */}
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

        {/* ─────────────────────────────────────────
          HOW OUR MARKETPLACE WORKS heading
          text-[#0000FF] text-3xl lg:text-5xl
          From screenshot: ~48px, centred, mt-5 mb-7 pt-5
      ───────────────────────────────────────── */}
        <div className="flex justify-center mt-5 mb-7 pt-5 px-3">
          <div
            className="shimmer"
            style={{ width: "min(460px, 85%)", height: 48, borderRadius: 10 }}
          />
        </div>

        {/* ─────────────────────────────────────────
          4-CARD GRID
          grid xl:grid-cols-4 sm:grid-cols-2 gap-10 px-[5%]
          From screenshot each card:
          — icon circle ~56px
          — label text ~24px
          — desc text 3 lines (13px)
          — screenshot image tall ~160px
          — total card height ~380px
      ───────────────────────────────────────── */}
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
              {/* Icon + label */}
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
              {/* Description lines */}
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
              {/* Screenshot image placeholder */}
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

        {/* ─────────────────────────────────────────
          TRADE SECURELY
          from-[#8A38F5]/50 to-[#4F8CFF]/50 mt-15
          grid md:grid-cols-2 max-w-6xl px-[5%] pb-10
          Left: phone.png ~240×400
          Right: heading text-4xl + paragraph
      ───────────────────────────────────────── */}
        <div
          style={{
            background:
              "linear-gradient(to bottom, rgba(138,56,245,0.35), rgba(79,140,255,0.35))",
            marginTop: 60,
            padding: "20px 5% 40px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              alignItems: "center",
              maxWidth: 1152,
              margin: "0 auto",
              gap: 32,
            }}
          >
            {/* Phone image */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                className="shimmer"
                style={{ width: 240, height: 400, borderRadius: 20 }}
              />
            </div>
            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                className="shimmer"
                style={{ width: "80%", height: 38, borderRadius: 8 }}
              />
              <div
                className="shimmer"
                style={{
                  width: "58%",
                  height: 38,
                  borderRadius: 8,
                  animationDelay: "0.1s",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  marginTop: 16,
                }}
              >
                {[100, 97, 93, 96, 88, 72].map((w, i) => (
                  <div
                    key={i}
                    className="shimmer"
                    style={{
                      width: `${w}%`,
                      height: 13,
                      borderRadius: 9999,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
          DATA / STATS HEADING + GROUP IMAGE
          text-3xl/5xl mt-5 pt-5 mb-7 centred
          group.png px-[10%] sm:px-[15%] lg:px-[20%]
      ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 12px",
            gap: 20,
          }}
        >
          <div
            className="shimmer"
            style={{ width: "min(500px, 90%)", height: 44, borderRadius: 10 }}
          />
          <div
            className="shimmer"
            style={{
              width: "56%",
              maxWidth: 520,
              height: 168,
              borderRadius: 16,
            }}
          />
        </div>

        {/* ─────────────────────────────────────────
          REVIEWS SECTION
          bg-white > gradient bg px-[5%] mt-15
          grid md:grid-cols-2
          Left: heading + body text + stat card (desktop)
          Right: 3 review cards (py-10 sm:px-10 lg:px-10)
      ───────────────────────────────────────── */}
        <div style={{ background: "#fff" }}>
          <div
            style={{
              background:
                "linear-gradient(to bottom, rgba(138,56,245,0.3), rgba(79,140,255,0.3))",
              padding: "0 5%",
              marginTop: 60,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              {/* LEFT */}
              <div
                style={{
                  padding: "60px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div
                  className="shimmer"
                  style={{ width: "90%", height: 30, borderRadius: 8 }}
                />
                <div
                  className="shimmer"
                  style={{
                    width: "68%",
                    height: 30,
                    borderRadius: 8,
                    animationDelay: "0.1s",
                  }}
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 9 }}
                >
                  {[100, 94, 80].map((w, i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{
                        width: `${w}%`,
                        height: 13,
                        borderRadius: 9999,
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  ))}
                </div>
                {/* Stat card desktop */}
                <div
                  className="hidden md:block"
                  style={{ padding: "0 10%", marginTop: 8 }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(79,140,255,0.35), rgba(138,56,245,0.35))",
                      borderRadius: 16,
                      padding: "12px 12px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        className="shimmer-light"
                        style={{ width: 148, height: 22, borderRadius: 9999 }}
                      />
                    </div>
                    <div style={{ padding: "0 24px" }}>
                      <div
                        className="shimmer-light"
                        style={{ height: 120, borderRadius: "16px 16px 0 0" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — 3 review cards */}
              <div
                style={{
                  padding: "40px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {[
                  { nw: 96, rw: 64, t2: "100%", t3: "72%" },
                  { nw: 112, rw: 56, t2: "100%", t3: "58%" },
                  { nw: 80, rw: 72, t2: "100%", t3: "80%" },
                ].map(({ nw, rw, t2, t3 }, i) => (
                  <div
                    key={i}
                    style={{
                      border: "0.5px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        className="shimmer"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          flexShrink: 0,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          className="shimmer"
                          style={{
                            width: nw,
                            height: 12,
                            borderRadius: 9999,
                            animationDelay: `${i * 0.1 + 0.05}s`,
                          }}
                        />
                        <div
                          className="shimmer"
                          style={{
                            width: rw,
                            height: 10,
                            borderRadius: 9999,
                            animationDelay: `${i * 0.1 + 0.1}s`,
                          }}
                        />
                      </div>
                      <div
                        className="shimmer"
                        style={{
                          width: 52,
                          height: 12,
                          borderRadius: 9999,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div
                      className="shimmer"
                      style={{ width: t2, height: 12, borderRadius: 9999 }}
                    />
                    <div
                      className="shimmer"
                      style={{
                        width: t3,
                        height: 12,
                        borderRadius: 9999,
                        animationDelay: "0.05s",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Stat card mobile */}
              <div
                className="md:hidden"
                style={{ padding: "0 10%", paddingBottom: 40 }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(79,140,255,0.35), rgba(138,56,245,0.35))",
                    borderRadius: 16,
                    padding: "12px 12px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      className="shimmer-light"
                      style={{ width: 148, height: 22, borderRadius: 9999 }}
                    />
                  </div>
                  <div style={{ padding: "0 24px" }}>
                    <div
                      className="shimmer-light"
                      style={{ height: 120, borderRadius: "16px 16px 0 0" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
          FAQ
          px-[5%] pt-13 pb-15
          Heading text-3xl sm:text-4xl
          8 accordion rows: gradient border p-[2px],
          inner bg-white h-[58px]
      ───────────────────────────────────────── */}
        <div style={{ padding: "0 5%" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              paddingTop: 52,
              gap: 10,
              marginBottom: 28,
            }}
          >
            <div
              className="shimmer"
              style={{ width: "min(300px, 90%)", height: 40, borderRadius: 10 }}
            />
            <div
              className="shimmer"
              style={{
                width: "min(340px, 90%)",
                height: 14,
                borderRadius: 9999,
                animationDelay: "0.1s",
              }}
            />
          </div>

          <div
            style={{
              paddingBottom: 60,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxWidth: 576,
              margin: "0 auto",
            }}
          >
            {[65, 52, 43, 60, 73, 55, 47, 50].map((w, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  background:
                    "linear-gradient(to right, rgba(138,56,245,0.3), rgba(79,140,255,0.3))",
                  padding: 2,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    height: 58,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    gap: 12,
                  }}
                >
                  <div
                    className="shimmer"
                    style={{
                      flex: 1,
                      maxWidth: `${w}%`,
                      height: 14,
                      borderRadius: 9999,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                  <div
                    className="shimmer"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────
          NEWSLETTER + FOOTER
          from-[#4F8CFF] to-[#8A38F5]
          Heading text-3xl sm:text-4xl md:text-5xl
          Sub 2 lines, input rounded-full h~62px
      ───────────────────────────────────────── */}
        <section
          style={{
            background: "linear-gradient(to bottom, #4f8cff, #8a38f5)",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px" }}>
            <div
              style={{
                padding: "96px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                className="shimmer-light"
                style={{
                  width: "min(340px, 90%)",
                  height: 46,
                  borderRadius: 10,
                }}
              />
              <div
                className="shimmer-light"
                style={{
                  width: "min(390px, 90%)",
                  height: 16,
                  borderRadius: 9999,
                  marginTop: 8,
                  animationDelay: "0.1s",
                }}
              />
              <div
                className="shimmer-light"
                style={{
                  width: "min(290px, 90%)",
                  height: 16,
                  borderRadius: 9999,
                  animationDelay: "0.15s",
                }}
              />
              <div
                className="shimmer-light"
                style={{
                  marginTop: 24,
                  width: "100%",
                  maxWidth: 672,
                  height: 62,
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.25)",
                  animationDelay: "0.1s",
                }}
              />
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 0.5,
              background: "rgba(255,255,255,0.15)",
            }}
          />

          {/* Footer links */}
          <div
            style={{
              maxWidth: 1152,
              margin: "0 auto",
              padding: "40px 20px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 32,
            }}
          >
            {[80, 64, 88, 56, 72, 60].map((w, i) => (
              <div
                key={i}
                className="shimmer-light"
                style={{
                  width: w,
                  height: 12,
                  borderRadius: 9999,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          <div
            style={{
              width: "100%",
              height: 0.5,
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Copyright */}
          <div
            style={{
              maxWidth: 1152,
              margin: "0 auto",
              padding: "48px 20px 24px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              className="shimmer-light"
              style={{ width: 256, height: 12, borderRadius: 9999 }}
            />
          </div>

          {/* Designed / Developed by */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              paddingBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                className="shimmer-light"
                style={{
                  width: 112,
                  height: 12,
                  borderRadius: 9999,
                  animationDelay: "0.1s",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                className="shimmer-light"
                style={{
                  width: 128,
                  height: 12,
                  borderRadius: 9999,
                  animationDelay: "0.2s",
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
