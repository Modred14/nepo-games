"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "../hooks/useAuthGuard";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Verified } from "lucide-react";
import NoGame from "@/components/NoGame";
import Loader from "@/components/Loader";
import ReactSlider from "react-slider";

export default function Marketplace() {
  useAuthGuard();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("");
  const [type, setType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0,5000000]);
  const [imagesLoaded, setImagesLoaded] = useState(0);

const getAmount = (price) => {
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
  return numericPrice;
};

  const router = useRouter();
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

  // const handleLogout = () => {
  //   const storedUser = localStorage.getItem("nepo-user");

  //   if (storedUser) {
  //     localStorage.removeItem("nepo-user");
  //     if (storedUser.token) localStorage.removeItem("nepo-token");
  //     router.push("/login");
  //   }
  // };


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
  if (loading || !isImagesReady) {
    return <Loader />;
  }

  return (
    <PageLoader>
      <div className="pb-20">
        <div className="flex border-b border-[#0000FF]/40 justify-between py-4 px-7 items-center">
          <p className="text-lg sm:text-xl font-bold">
            Hello, {user?.username}
          </p>
          <div className="flex items-center gap-2 sm:gap-5">
            {" "}
            <div className="relative w-30 sm:w-70 ">
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
            <div className="sm:block hidden">
              <p className="text-sm bg-blue-500 text-gray-50 rounded-lg p-2 px-3">
                Become a seller
              </p>
            </div>
            <a href="/profile">
            <button className="border w-9 border-blue-600/40 rounded-3xl">
              <img src={user?.profile_image} alt="" />
            </button></a>
          </div>
        </div>
        <div className="px-[3%] w-full ">
          <div className="w-full mt-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white border border-blue-600/20 rounded-xl p-3 shadow-sm">
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
                  <option value="EA Sports (FIFA)">EA Sports (FIFA)</option>
                  <option value="Delta Force">Delta Force</option>
                  <option value="Dream League Soccer">
                    Dream League Soccer
                  </option>
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

                          if (value >5000000) value =5000000;
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
                  className="w-full flex items-center mt-2"
                  thumbClassName="w-2 h-2 bg-blue-600 rounded-full cursor-grab focus:outline-none"
                  trackClassName="h-1 bg-gray-300 rounded-full"
                  min={0}
                  max={5000000}
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
                  setPriceRange([0,5000000]);
                }}
                className="ml-auto  px-2 py-1 border border-blue-600/30 text-[13px] rounded-lg bg-blue-100 hover:bg-blue-200 transition"
              >
                Reset
              </button>
            </div>
          </div>
          {filteredGames.length === 0 ? (
            <div className="h-[60vh]">
              <NoGame />
            </div>
          ) : (
            <div className="grid py-3 sm:py-10 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:flex gap-2 sm:gap-5 flex-wrap">
              {filteredGames.map((game, index) => {
                return (
                  <div key={index}>
                    <div className="border-2 rounded-md border-[#4F8CFF]">
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
                      <div className="w-full  ">
                        <img
                          src={game.cover_image}
                          className="w-full h-50 object-cover rounded-t-[4.5px] "
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
                        <a href={`/game${game.slug}`}>
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
        </div>{" "}
      </div>
    </PageLoader>
  );
}
