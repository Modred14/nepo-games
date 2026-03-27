"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "../hooks/useAuthGuard";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Verified } from "lucide-react";
import NoGame from "@/components/NoGame";

export default function Marketplace() {
  useAuthGuard();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log(parsedUser);
    }
  }, []);
  const handleLogout = () => {
    const storedUser = localStorage.getItem("nepo-user");

    if (storedUser) {
      localStorage.removeItem("nepo-user");
      if (storedUser.token) localStorage.removeItem("nepo-token");
      router.push("/login");
    }
  };
  const games = [
    {
      id: "1",
      user_id: "2",
      title: "Call of Duty",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: true,
    },
    {
      id: "1",
      user_id: "2",
      title: "Efootball",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: true,
    },
    {
      id: "1",
      user_id: "2",
      title: "Free Fire",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: false,
    },
    {
      id: "1",
      user_id: "2",
      title: "Efootball",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: true,
    },
    {
      id: "1",
      user_id: "2",
      title: "Efootball",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: true,
    },
    {
      id: "1",
      user_id: "2",
      title: "Efootball",
      slug: "/1",
      description: "This is an efootball account",
      views_count: "1003",
      price: "N 1,000",
      currency: "NGN",
      proof_image_url: "",
      cover_image: "/call-of-duty.png",
      platform: "Mobile",
      status: "Active",
      created_at: "10pm",
      updated_at: "",
      deleted_at: "",
      verified: true,
    },
  ];

  const filteredGames = games.filter((game) =>
    game.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <PageLoader>
      <div>
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
                className="bg-gray-200 w-full p-2 pl-9 sm:pl-10 text-sm rounded-2xl border border-blue-600/40"
                placeholder="Search for gaming accounts"
              />
            </div>
            <div className="sm:block hidden">
              <p className="text-sm bg-blue-500 text-gray-50 rounded-lg p-2 px-3">
                Become a seller
              </p>
            </div>
            <button
              className="border w-9 border-blue-600/40 rounded-3xl"
              onClick={handleLogout}
            >
              <img src={user?.profile_image} alt="" />
            </button>
          </div>
        </div>
        <div className="px-[2%]   w-full py-[5%] sm:py-[2%]">
          {filteredGames.length === 0 ? (
           <div className="h-[65vh]">
  <NoGame />
</div>
          ) : (
            <div className="grid grid-cols-1 justify-center xs:grid-cols-2 sm:flex gap-2 sm:gap-5 flex-wrap">
              {filteredGames.map((game, index) => {
                return (
                  <div key={index}>
                    <div className="border-2 rounded-md border-[#4F8CFF] sm:w-70">
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
                          className="w-fit h-50 object-cover rounded-t-[4.5px] "
                          alt=""
                        />
                      </div>{" "}
                      <div className="px-2 flex items-center py-3  justify-between">
                        {" "}
                        <div>
                          <div className="text-[#0000FF] font-bold ">
                            {game.title}
                          </div>
                          <div>{game.price}</div>
                        </div>
                        <a>
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
