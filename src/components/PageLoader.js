"use client";

import { useEffect, useState } from "react";

export default function PageLoader({ children }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setLoaded(true);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {!loaded && (
        <div className="fixed min-h-screen inset-0 z-9999 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-700 p-3 rounded-2xl">
              {" "}
              <img
                src="/logo.png"
                alt="Nepogames"
                className="w-16 animate-pulse"
              />
            </div>

            <p className="text-blue-700 font-semibold">Loading Nepogames<span className="loading-dots"></span></p>

            <div className="w-40 h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-blue-600 animate-loading w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
