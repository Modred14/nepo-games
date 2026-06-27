"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NoGame() {
  return (
    <div className="flex h-full w-screen  items-center justify-center ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative"
      >
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border  border-gray-200 px-10 py-12 text-center">
          {/* Subtle top glow */}
    
          {/* Floating icon */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-[22px] bg-blue-50 border border-blue-100"
          >
            <Image
              src="/nogame.png"
              alt="No games found"
              width={80}
              height={80}
              className="object-contain drop-shadow-sm"
              priority
            />
          </motion.div>

          {/* Text */}
          <div className="relative z-10">
            <h2 className="text-gray-900 text-xl font-semibold tracking-tight mb-2">
              No Games Found
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              There are no listings available right now. Check back soon for new
              game accounts.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={window.location.origin + "/marketplace"}>
                <motion.button
                  whileHover={{
                    y: -2,
                    boxShadow: "0 8px 24px rgba(0,71,255,0.20)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0047FF] hover:bg-[#0040EE] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Explore Marketplace
                </motion.button>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
