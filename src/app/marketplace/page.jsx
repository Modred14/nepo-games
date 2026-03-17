"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "../hooks/useAuthGuard";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function Marketplace() {
  useAuthGuard();
  const [user, setUser] = useState(null);

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

  return (
    <PageLoader>
      <div>
        <div className="flex border-b border-[#0000FF]/40 justify-between py-4 px-7 items-center">
          <p className="text-xl font-bold">Hello, {user?.username}</p>
          <div className="flex items-center gap-5">
            {" "}
            <div className="relative w-70">
              <Search
                size={15}
                className="absolute left-3 -mt-[0.25px] top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="search"
                className="bg-gray-200 w-full p-2 pl-10 text-sm rounded-2xl border border-blue-600/40"
                placeholder="Search for gaming accounts"
              />
            </div>
            <div>
              <img src="" alt="" />
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
      </div>
    </PageLoader>
  );
}
