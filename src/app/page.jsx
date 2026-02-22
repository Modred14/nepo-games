"use client";
import { Star } from "lucide-react";
import Reveal from "./reveal";
import { useEffect, useRef } from "react";

export default function Home() {
  function StatCard({ iconSrc, value, label, className = "" }) {
    return (
      <div
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

        <div className="text-4xl font-extrabold leading-none">{value}</div>
        <div className="text-sm font-semibold opacity-95">{label}</div>
      </div>
    );
  }

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
      logo: "./gameloft_512.png",
    },
    // {
    //   name : "",
    //   logo: "",
    // },
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
          <header>
            <div>
              {" "}
              <div className="px-20   border-b border-gray-300 ">
                <div className="flex text-center py-4 font-semibold  items-center text-[#808080] justify-between w-full">
                  <div></div>
                  <div className="flex gap-9">
                    <div>
                      <a href="">Marketplace</a>
                    </div>
                    <div>
                      <a href="">Pricing</a>
                    </div>
                    <div>
                      <a href="">About Us</a>
                    </div>
                    <div>
                      <a href="">Support</a>
                    </div>
                  </div>
                  <div>
                    <button className="py-2 px-3 rounded-md border mr-4  hover:bg-gray-200/20 bg-white duration-500 transition-all">
                      Log In
                    </button>
                    <button className="py-2 px-3 rounded-md  hover:bg-blue-800 border border-blue-600/90 duration-500 transition-all bg-[#0000FF] text-white font-bold">
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>{" "}
          </header>
        </Reveal>
      </div>
      <main>
        <Reveal>
          <div className="grid grid-cols-1 pt-20 lg:grid-cols-2 pb-10">
            <div className="font-bold pl-10 ">
              <div className="text-8xl pt-10">
                The Premium{" "}
                <span className="text-[#0000FF]">Gaming Account</span>{" "}
                Marketplace
              </div>
              <p className="text-gray-500 font-medium text-3xl pt-7 text-center">
                Redefining how premium gaming accounts are traded — securely and
                transparently. Skip the grind.{" "}
                <span className="font-bold text-[#0000FF] italic">
                  Trade with confidence.
                </span>
              </p>
              <div className="pt-10 grid grid-cols-2  max-w-120">
                <div className="flex justify-center">
                  <button className=" rounded-2xl py-5 px-8 hover:bg-blue-800 border border-blue-600/90 duration-500 transition-all text-lg bg-[#0000FF] text-white font-semibold">
                    Buy Account
                  </button>
                </div>
                <div className="flex justify-center">
                  {" "}
                  <button className=" py-5 px-5 rounded-2xl border mr-2 hover:bg-gray-200/50 bg-white  duration-500 transition-all text-lg">
                    Sell your account
                  </button>
                </div>
              </div>
            </div>
            <div className="p-20 ">
              <img src="/nepo-market.png" alt="" />
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="flex justify-center">
            <div ref={scrollerRef} className="scroller bg-[#0000FF]">
              <div className="scroller_inner tag-list">
                {games.map((game) => (
                  <div key={game.name} className="logoWrap">
                    <img src={game.logo} alt={game.name} className="logoImg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div>
            <div className="grid w-full justify-center items-center ">
              <p className=" bg-linear-to-r gap-6 from-[#0000FF] to-[#1E3A8A] shadow-md border border-blue-100 shadow-blue-400 mt-10 text-[#FFFFFF] justify-center items-center flex text-4xl  rounded-full py-5 px-10">
                <Star className="fill-white" size={40}></Star>
                <span className="font-bold">Features</span>
              </p>
            </div>
            <p className="text-[#0000FF] font-bold text-5xl pt-5 flex w-full justify-center">
              All Your Games. One Secure Marketplace
            </p>
            <div className="w-full flex pt-4 items-center justify-center">
              <p className="text-2xl text-center text-gray-900- max-w-300 px-3 pb-7">
                Built for serious gamers, Nepo Games provides escrow protection,
                verified sellers, and seamless transfers — so every trade is
                smooth, safe, and guaranteed.
              </p>
            </div>
            <div className="grid grid-cols-3 text-2xl text-center gap-3 px-2 ">
              <div className="group rounded-2xl pb-10 bg-[#FBF6F6] px-2 border shadow-blue-900 shadow-sm border-blue-100 hover:border-blue-700 transition-all duration-700">
                <div className="p-15 pb-5">
                  {" "}
                  <div className="w-full  h-100 overflow-hidden rounded-3xl">
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
                  <div className="w-full  h-100 overflow-hidden rounded-3xl">
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
                  <div className="w-full  h-100 overflow-hidden rounded-3xl">
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
            <div className="relative mx-auto w-full max-w-250 min-h-162.5 overflow-hidden rounded-3xl">
              {/* TOP */}
              <div className="absolute left-1/2 top-10 -translate-x-1/2">
                <StatCard
                  iconSrc="book.png"
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
                  value="1M+"
                  label="Money Traded"
                />
              </div>
              {/* BOTTOM */}
              <div className="absolute left-1/2 bottom-10 -translate-x-1/2">
                <StatCard
                  iconSrc="link.png"
                  value="2K+"
                  label="Account Listed"
                />
              </div>
              {/* CENTER PILL */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <button
                  className={[
                    "flex items-center gap-2 rounded-full px-6 py-3",
                    "bg-linear-to-r from-[#3B82F6] to-[#1E3A8A] text-white font-bold",
                    "shadow-md",
                    "backdrop-blur-md",
                    "hover:scale-[1.03] active:scale-[0.98]",
                    "transition-transform",
                    " border",
                    " border-blue-100 ",
                    "shadow-blue-400",
                  ].join(" ")}
                >
                  <span className=" ">★</span>
                  Stats
                </button>
              </div>{" "}
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
