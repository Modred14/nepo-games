"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("nepo-user");

    if (!user) {
      router.replace("/login");
    }
  }, [router]);
}
