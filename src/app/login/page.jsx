"use client";

import PageLoader from "@/components/PageLoader";
import LoginClient from "./LoginClient";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import Loader from "@/components/Loader";

function PageContent() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const safeUser = {
        ...session.user,
        profile_image:
          session.user.profile_image?.trim() ||
          "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      };

      localStorage.setItem("nepo-user", JSON.stringify(safeUser));
    }

    if (status === "unauthenticated") {
      localStorage.removeItem("nepo-user");
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <LoginClient />;
}

export default function LoginPage() {
  return (
    <SessionProvider>
      {" "}
      <PageLoader>
        <PageContent />{" "}
      </PageLoader>
    </SessionProvider>
  );
}
