"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "../hooks/useAuthGuard";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";


export default function Marketplace() {

  useAuthGuard();
 const [user, setUser] = useState(null);


 const router = useRouter()
  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log(parsedUser);
    }
  }, []);
  const handleLogout = () =>{
    const storedUser = localStorage.getItem("nepo-user");

       if (storedUser) {
        localStorage.removeItem("nepo-user");
        if (storedUser.token) localStorage.removeItem("nepo-token");
       router.push("/login");
      }
  }

  return (
    <PageLoader>
      <div>
        <div>
          <p>Hello, {user?.first_name}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </PageLoader>
  );
}
