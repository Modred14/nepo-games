"use client";
import { Star } from "lucide-react";
import Reveal from "./reveal";
import { useEffect, useRef } from "react";

export default function Home() {
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
      <Reveal>
        <header className="px-20">
          <div className="flex text-center py-4 font-semibold items-center text-gray-500 justify-between  border-b border-gray-300 w-full">
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
              <button className="py-2 px-3 rounded-md border mr-4 hover:bg-gray-200 duration-500 transition-all">
                Log In
              </button>
              <button className="py-2 px-3 rounded-md  hover:bg-blue-800 border border-blue-600/90 duration-500 transition-all bg-blue-700 text-white font-bold">
                Get Started
              </button>
            </div>
          </div>
        </header>
      </Reveal>
      <main>
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="font-bold pl-10 pt-10">
              <div className="w-full px-10  bg-blue-100/70 border rounded-2xl border-blue-800">
                <p className="text-blue-700 uppercase text-md ">
                  Trusted by over 500K+ gamers worldwide
                </p>
              </div>
              <div className="text-8xl pt-10">
                The Premium{" "}
                <span className="text-blue-700">Gaming Account</span>{" "}
                Marketplace
              </div>
              <p className="text-gray-500 font-medium text-lg pt-7 max-w-120">
                Redefining how premium gaming accounts are traded — securely and
                transparently. Skip the grind. Trade with confidence.
              </p>
              <div className="pt-10 grid grid-cols-2  max-w-120">
                <div className="flex justify-center">
                  <button className=" rounded-md py-4 px-5 hover:bg-blue-800 border border-blue-600/90 duration-500 transition-all text-lg bg-blue-700 text-white font-semibold">
                    Buy Account
                  </button>
                </div>
                <div className="flex justify-center">
                  {" "}
                  <button className=" py-4 px-5 rounded-md border mr-2 hover:bg-gray-200 duration-500 transition-all text-lg">
                    Sell your account
                  </button>
                </div>
              </div>
            </div>
            <div className="p-10">
              <img src="/nepo-market.png" alt="" />
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="flex justify-center">
            <div ref={scrollerRef} className="scroller bg-blue-700">
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
            <div className="grid w-full justify-center items-center">
              <p className=" bg-blue-700 from-blue-700 to-blue-900 shadow-md border border-blue-100/80 shadow-blue-400 mt-10 text-gray-50 justify-center items-center flex gap-3 px-7 text-4xl  rounded-3xl py-3">
                <Star className="fill-white"></Star>
                <span className="font-bold">Features</span>
              </p>
            </div>
            <p className="text-blue-700 font-bold text-5xl pt-5 flex w-full justify-center">
              All Your Games. One Secure Marketplace
            </p>
            <div className="w-full flex pt-4 items-center justify-center">
              <p className="text-2xl text-center max-w-300 px-3">
                Built for serious gamers, Nepo Games provides escrow protection,
                verified sellers, and seamless transfers — so every trade is
                smooth, safe, and guaranteed.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-sm bg-gray-100">
                <img src="" alt="" />
                <p>Escrow-Protected Payments</p>
                <p>
                  Every transaction on our platform is secured with escrow
                  protection. The buyer’s funds are safely held until the
                  account transfer is fully completed and verified. This ensures
                  both parties are protected and eliminates the risk of scams or
                  chargebacks. Trade with complete confidence knowing your money
                  is always safe.
                </p>
              </div>
              <div className="rounded-sm bg-gray-100">
                <img src="" alt="" />
                <p>Advanced Search & Smart Filters</p>
                <p>
                  Find exactly what you’re looking for in seconds. Filter
                  accounts by game title, rank, skins, price range, platform,
                  and more. Our smart filtering system makes it easy to compare
                  listings and discover the best deals without wasting time.
                </p>
              </div>
              <div className="rounded-sm bg-gray-100">
                <img src="" alt="" />
                <p>Secure In-Platform Messaging</p>
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
      </main>
    </div>
  );
}
