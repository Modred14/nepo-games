"use client";
import Image from "next/image";

export default function Loader() {
  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-700 p-3 rounded-2xl">
            {" "}
            <Image
              src="/logo.png"
              alt="Nepogames"
              width={64}
              priority
              height={64}
              className="animate-pulse"
            />
          </div>

          <p className="text-blue-700 font-semibold">
            Loading Nepogames<span className="loading-dots"></span>
          </p>

          <div className="w-40 h-1 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-blue-600 animate-loading w-1/2"></div>
          </div>
        </div>
      </div>
    </>
  );
}
