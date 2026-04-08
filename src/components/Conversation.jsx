"use client";

import { useRef } from "react";
import { Send, Star } from "lucide-react";

export default function Conversation({ buyerId, GameDetails }) {
  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    if (!localPart || localPart.length < 3) {
      return email; // too short to safely mask
    }

    const start = localPart.slice(0, 2); // "em"
    const end = localPart.slice(-2); // "ur"

    return `${start}***${end}@${domain}`;
  }
  const inputRef = useRef(null);

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-cover bg-center">
      <div className="p-4 md:grid hidden">
        <div className="border border-blue-500/40 rounded-xl shadow-sm bg-white sm:min-w-60 lg:min-w-72 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-blue-50">
            <p className="font-semibold text-blue-700 text-center text-sm tracking-wide">
              SELLER INFORMATION
            </p>
          </div>

          {/* Seller Info */}
          <div className="flex px-4 py-4 items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="font-semibold text-[#0000FF]">"game.username"</p>
            </div>

            <img
              src="{game.profile_image}"
              className="w-11 h-11 rounded-full border-2 border-blue-500/60 object-cover"
              alt="seller"
            />
          </div>

          {/* Rating */}
          <div className="px-4 pb-4 border-b">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className="text-gray-300" />
              ))}
            </div>
            <p className="text-xs text-gray-500">No ratings yet</p>
          </div>

          {/* Performance */}
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-[#0000FF] mb-3">
              Seller Performance
            </p>

            <div className="flex justify-between items-center">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-[#0000FF]">Quality:</span>{" "}
                  <span className="font-medium text-green-600">Excellent</span>
                </p>
                <p>
                  <span className="text-[#0000FF]">Ratings:</span>{" "}
                  <span className="font-medium text-yellow-600">Good</span>
                </p>
                <p>
                  <span className="text-[#0000FF]">Response:</span>{" "}
                  <span className="font-medium text-green-600">Fast</span>
                </p>
              </div>

              <img
                src="/Vector (1).png"
                className="h-14 opacity-80"
                alt="performance"
              />
            </div>
          </div>
        </div>
      </div>{" "}
      <div className="relative z-10 h-screen  overflow-hidden flex flex-col w-full">
        <div className="relative z-10 h-screen flex flex-col w-full overflow-hidden">
          {/* background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/conversation.png')" }}
          />
          <div className="absolute inset-0 bg-white/80" />

          {/* CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col h-full">
            {/* HEADER (NO FIXED) */}
            <div className="p-4 shrink-0">
              <div className="w-full p-2 px-5 rounded-3xl bg-blue-500/15 border backdrop-blur-sm border-blue-700/50">
                <div className="flex gap-2 items-center">
                  <img
                    src="/profile.png"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      UserName
                    </p>
                    <p className="text-xs text-gray-800">
                      {maskEmail("favourdomirin@gmail.com")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MESSAGES (THIS IS THE KEY FIX) */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              Հայերեն Shqip ‫العربية Български Català 中文简体 Hrvatski Česky
              Dansk Nederlands English Eesti Filipino Suomi Français ქართული
              Deutsch Ελληνικά ‫עברית हिन्दी Magyar Indonesia Italiano Latviski
              Lietuviškai македонски Melayu Norsk Polski Português Româna
          Lorem ipsum dolor sit amet..", comes
              from a line in section 1.10.32. The standard chunk of Lorem Ipsum
 " help@lipsum.com Privacy Policy ·
            </div>

            {/* INPUT (NO FIXED) */}
            <div className="p-4 mb-8 shrink-0">
              <div
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-3  min-w-0
          bg-white/80 backdrop-blur-xl 
          border border-blue-700/50
          rounded-full px-4 py-2
          shadow-xs cursor-text"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0">
                  <img
                    src="/conversation.png"
                    className="w-full h-full object-cover"
                  />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-gray-700 xs:text-base text-sm"
                />

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex min-w-0 items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
