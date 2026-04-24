"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    window.addEventListener("routeChangeStart", handleStart);

    return () => {
      window.removeEventListener("routeChangeStart", handleStart);
    };
  }, []);

  return loading ? <Loading /> : null;
}
