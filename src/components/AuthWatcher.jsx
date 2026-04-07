"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Loader from "./Loader";

export default function AuthWatcher() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      localStorage.setItem("nepo-user", JSON.stringify(session.user));
    }

    if (status === "unauthenticated") {
      localStorage.removeItem("nepo-user");
    }
  }, [status, session]);

  // ✅ THIS is where UI rendering happens
  if (status === "loading") {
    return <Loader />;
  }

  return null;
}