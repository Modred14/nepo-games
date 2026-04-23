"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuthGuard from "../hooks/useAuthGuard";
import Reveal from "../reveal";
import { Search, ShoppingCart, Verified, MessageCircle } from "lucide-react";
import NoGame from "@/components/NoGame";
import ReactSlider from "react-slider";
import SmallLoader from "@/components/smallLoader";
import { signOut } from "next-auth/react";

export default function Marketplace() {
  useAuthGuard();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("");
  const [type, setType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    setUser(user);
  }, []);
  const user_id = user?.id;
 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAmount = (price) => {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    return numericPrice;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log(parsedUser);
    }
  }, []);

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

    await signOut({
      callbackUrl: "/login", // where to go after logout
    });
  };
  function formatGamePrice(price) {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    return `₦ ${numericPrice.toLocaleString()}`;
  }

  const filteredGames = games
    .filter((game) => {
      const matchesSearch = game.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPlatform = !platform || game.platform === platform;
      const matchesGame = !type || game.title === type;
      const matchesVerified = !verifiedOnly || game.verified === true;
      const amount = getAmount(game.price);

      const matchesMin = amount >= priceRange[0];
      const matchesMax = amount <= priceRange[1];
      return (
        matchesSearch &&
        matchesPlatform &&
        matchesGame &&
        matchesVerified &&
        matchesMin &&
        matchesMax
      );
    })
    .sort((a, b) => b.verified - a.verified);
  const router = useRouter();
  const openChat = () => {
    router.push(`/c/1?receiver_id=1`);
  };
  const isImagesReady =
    filteredGames.length === 0 || imagesLoaded >= filteredGames.length;
  useEffect(() => {
    let count = 0;

    if (filteredGames.length === 0) return;

    filteredGames.forEach((game) => {
      const img = new Image();
      img.src = game.cover_image;

      img.onload = img.onerror = () => {
        count++;
        if (count === filteredGames.length) {
          setImagesLoaded(filteredGames.length);
        }
      };
    });
  }, [filteredGames]);

  return (
    <div>
      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
      <button
        onClick={() => openChat()}
        className="
        fixed bottom-5 right-5
        z-[9999]
        w-14 h-14
        rounded-full
        bg-blue-600 hover:bg-blue-700
        text-white shadow-sm
        flex items-center justify-center
        transition-all duration-300
        border-2 border-white
      "
      >
        <MessageCircle size={24} />
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
      </button>
      <Reveal className="overflow-auto">
        <div className="pb-20">
          <div className="flex border-b border-[#0000FF]/40 justify-between py-3 sm:py-4 px-7 items-center">
            <p className="text-base sm:text-lg font-bold">
              Hello, {user?.username}
            </p>
            <div className="flex items-center gap-1 sm:gap-5">
              {" "}
              <div className="hidden sm:flex relative w-30 sm:w-70 ">
                <Search
                  size={15}
                  className="absolute left-3 -mt-[0.25px] top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-200 w-full p-2 pl-9 text-xs sm:text-sm  rounded-2xl border border-blue-600/40"
                  placeholder="Search gaming accounts"
                />
              </div>
              {!user?.phone_verified && (
                <a onClick={() => router.push(`/seller`)}>
                  <div className="sm:block hidden">
                    <p className="text-xs md:text-sm bg-blue-500 text-gray-50 rounded-lg p-2 px-3">
                      Become a seller
                    </p>
                  </div>
                </a>
              )}
              <div className="flex items-center">
                <div
                  ref={ref}
                  onMouseEnter={() => {
                    setOpen(true);
                    setLogOpen(false);
                  }}
                  className="relative w-fit"
                >
                  <a>
                    <img
                      src={user?.profile_image}
                      onClick={() => setOpen(true)}
                      alt="Nepo Games"
                      className="border-blue-600/70 border w-9 h-9 rounded-full object-cover cursor-pointer"
                    />
                  </a>

                  {open && (
                    <>
                      {" "}
                      <div className="absolute right-0 mt-1 bg-white/95 backdrop-blur-md border  border-[#7A7AFE]/50 shadow-sm rounded-sm z-50 overflow-hidden transition-all duration-200">
                        <a
                          onClick={() => router.push(`/profile`)}
                          className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition"
                        >
                          <span className="text-xs">👤</span>
                          Profile
                        </a>{" "}
                        {!user?.phone_verified && (
                          <div className="w-full">
                            {" "}
                            <div className="h-px bg-gray-200 mx-2"></div>
                            <a
                              onClick={() => router.push(`/seller`)}
                              className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700 hover:bg-gray-100/80 transition  whitespace-nowrap"
                            >
                              <span className="text-xs">📦</span>
                              Become Seller{" "}
                            </a>
                          </div>
                        )}
                        {/* Divider */}
                        <div className="h-px bg-gray-200 mx-2"></div>
                        {/* Logout */}
                        <button
                          onClick={() => {
                            setOpen(false);
                            setLogOpen(true);
                          }}
                          className="flex items-center cursor-pointer gap-3 w-full px-4 py-3 text-xs text-red-500 hover:bg-red-50 transition"
                        >
                          <span className="text-xs">🚪</span>
                          Logout
                        </button>
                      </div>{" "}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* <div className="flex  items-center sm:hidden gap-3 px-5 bg-blue-400/30 py-3 mb-4">
            <div className=" flex relative w-full ">
              <Search
                size={15}
                className="absolute left-3 -mt-[0.25px] top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-200 w-full p-2 pl-9 text-xs sm:text-sm  rounded-2xl border border-blue-600/40"
                placeholder="Search gaming accounts"
              />
            </div>
            {!user?.phone_verified && (
              <a onClick={() => router.push(`/seller`)}>
                <div className="">
                  <p className="text-xs whitespace-nowrap md:text-sm bg-blue-500 text-gray-50 rounded-lg p-2 px-3">
                    Become a seller
                  </p>
                </div>
              </a>
            )}
          </div> */}
          <div className="px-[3%] w-full ">
            <div className="w-full mt-3">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white border border-blue-600/20 rounded-xl p-3 shadow-sm">
                <div className="flex  items-center sm:hidden w-full gap-3 px-2 bg-blue-400/30 rounded-sm py-3">
                  <div className=" flex  relative w-full ">
                    <Search
                      size={15}
                      className="absolute left-3 -mt-[0.25px] top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-gray-200 w-full p-2 pl-9 text-xs sm:text-sm  rounded-2xl border border-blue-600/40"
                      placeholder="Search gaming accounts"
                    />
                  </div>
                  {!user?.phone_verified && (
                    <a onClick={() => router.push(`/seller`)}>
                      <div className="">
                        <p className="text-xs whitespace-nowrap md:text-sm bg-blue-500 text-gray-50 rounded-lg p-2 px-3">
                          Become a seller
                        </p>
                      </div>
                    </a>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-40">
                  <label className="text-xs text-gray-500">Game</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 outline-none"
                  >
                    <option value="">All Games</option>
                    <option value="Efootball">Efootball</option>
                    <option value="Call of Duty">Call of Duty</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="PubG">PubG</option>
                    <option value="Blood Strike">Blood Strike</option>
                    <option value="EA Sports">EA Sports (FIFA)</option>
                    <option value="Delta Force">Delta Force</option>
                    <option value="DLS">Dream League Soccer (DLS)</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1 min-w-40">
                  <label className="text-xs text-gray-500">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="p-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 outline-none"
                  >
                    <option value="">All Platforms</option>
                    <option value="mobile">Mobile</option>
                    <option value="pc">PC</option>
                    <option value="xbox">Xbox</option>
                    <option value="playstation">PlayStation</option>
                  </select>
                </div>
                {/* Price (compact but powerful) */}
                <div className="flex flex-col flex-1 min-w-45">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center text-xs ">
                    <span className="text-xs lg:text-sm text-gray-500 ">
                      Price
                    </span>{" "}
                    <div className="flex gap-2 ">
                      {/* MIN */}
                      <div className="relative w-24 ">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={priceRange[0] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setPriceRange(["", priceRange[1]]);
                              return;
                            }

                            let value = Number(val);

                            if (value < 0) value = 0;
                            if (value > priceRange[1]) value = priceRange[1];

                            setPriceRange([value, priceRange[1]]);
                          }}
                          placeholder="Min"
                          className="w-full pl-6 pr-2 py-1 border border-blue-600/50 rounded-sm focus:outline-none text-black"
                        />
                      </div>

                      {/* MAX */}
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={priceRange[1] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (val === "") {
                              setPriceRange([priceRange[0], ""]);
                              return;
                            }
                            let value = Number(val);

                            if (value > 50000000) value = 50000000;
                            if (value < priceRange[0]) value = priceRange[0];
                            if (priceRange[0] !== "" && value < priceRange[0]) {
                              value = priceRange[0];
                            }

                            setPriceRange([priceRange[0], value]);
                          }}
                          placeholder="Max"
                          className="w-full pl-6 pr-2 py-1 border border-blue-600/50 rounded-sm focus:outline-none text-black"
                        />
                      </div>
                    </div>
                  </div>
                  <ReactSlider
                    className="w-full pt-1 flex items-center mt-2"
                    thumbClassName="w-2 h-2 bg-blue-600 rounded-full cursor-grab focus:outline-none"
                    trackClassName="h-1 bg-gray-300 rounded-full"
                    min={0}
                    max={50000000}
                    value={priceRange}
                    onChange={(val) => setPriceRange(val)}
                    pearling
                    minDistance={0}
                    renderTrack={(props, state) => {
                      return (
                        <div
                          {...props}
                          className={`h-1 rounded-full ${
                            state.index === 1 ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        />
                      );
                    }}
                  />
                </div>

                {/* Verified */}
                <label className="flex items-center gap-2 text-sm ">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="accent-green-600"
                  />
                  <span className="text-green-600 text-xs font-bold">
                    Verified Sellers
                  </span>
                </label>

                {/* Reset */}
                <button
                  onClick={() => {
                    setPlatform("");
                    setType("");
                    setVerifiedOnly(false);
                    setSearch("");
                    setPriceRange([0, 50000000]);
                  }}
                  className="ml-auto  px-2 py-1 border border-blue-600/30 text-[13px] rounded-lg bg-blue-100 hover:bg-blue-200 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {loading || !isImagesReady ? (
              <div className="h-[65vh] flex items-center justify-center">
                <SmallLoader />
              </div>
            ) : (
              <div>
                {filteredGames.length === 0 ? (
                  <div className="h-[60vh]">
                    <NoGame />
                  </div>
                ) : (
                  <div className="grid py-3 sm:py-10 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:flex gap-2 sm:gap-5 flex-wrap">
                    {filteredGames.map((game, index) => {
                      return (
                        <div key={index}>
                          <div className="border group rounded-md h-full overflow-hidden border-[#4F8CFF] hover:border-[#0051e8] shadow-xs transition-all duration-300 hover:shadow-sm">
                            {game.verified && (
                              <div className="w-full flex justify-end pr-2">
                                {" "}
                                <div className="-mb-93">
                                  <div className="flex  relative mt-2 py-0.5 w-fit rounded-2xl border px-2 gap-1 bg-green-100 text-xs text-green-800 items-center">
                                    Verified Trader{" "}
                                    <Verified
                                      className="fill-green-600 text-green-100"
                                      size={16}
                                    />
                                  </div>
                                </div>{" "}
                              </div>
                            )}{" "}
                            <div className="w-full hover:border-[#0051e8] border-b border-[#4F8CFF]  transition-all duration-300">
                              <img
                                src={game.cover_image}
                                className="w-full h-50 object-cover  "
                                alt=""
                              />
                            </div>{" "}
                            <div className="px-2 flex items-center py-3  justify-between">
                              {" "}
                              <div>
                                <div className="text-[#0000FF] font-bold ">
                                  {game.title}
                                </div>
                                <div>{formatGamePrice(game.price)}</div>
                              </div>
                              <a
                                onClick={() => router.push(`/game${game.slug}`)}
                              >
                                <button className="flex  text-white p-1.5 rounded-lg border border-[#0038C9] bg-linear-to-b from-[#4F8CFF] to-[#8A38F5] b items-center gap-1 sm:text-sm text-xs">
                                  Buy{" "}
                                  <ShoppingCart
                                    size={14}
                                    className="text-white fill-white"
                                  />
                                </button>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>{" "}
        </div>
      </Reveal>
    </div>
  );
}
