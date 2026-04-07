"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import Signup from "./signUpClient";
import Loader from "@/components/Loader";

function PageContent() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      localStorage.setItem("nepo-user", JSON.stringify(session.user));
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

  return <Signup />;
}

export default function SignupPage() {
  return (
    <SessionProvider>
      <PageContent />
    </SessionProvider>
  );
}