"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Gamepad2, Home, ArrowLeft } from "lucide-react";

export default function GameNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full text-blue-600 flex items-center justify-center bg-[#050816] relative overflow-hidden">
      {/* glowing background effects */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] top-[-200px] left-[-200px]" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] bottom-[-200px] right-[-200px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md px-6"
      >
        {/* glitch icon circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 backdrop-blur-md relative"
        >
          {/* pulsing glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-500/20"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* floating icon */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10"
          >
            <Gamepad2 className="text-blue-400 w-10 h-10" />
          </motion.div>
        </motion.div>
        <h1 className="text-3xl font-bold ">Game Not Found</h1>
        <p className="text-gray-400 mt-3 text-sm leading-relaxed">
          This listing may have been removed, sold, or never existed.
          <br />
          Double-check the link or explore other accounts.
        </p>

        {/* subtle divider glow */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

        {/* actions */}
        <div className="flex flex-col mt-5 gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 transition px-4 py-2 rounded-xl border border-white/10"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <button
            onClick={() => router.push("/marketplace")}
            className="flex text-white items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition px-4 py-2 rounded-xl"
          >
            <Home size={16} />
            Browse Marketplace
          </button>
        </div>

        {/* tiny footer hint */}
        <p className="text-[11px] text-gray-500 mt-6">
          Error code: LISTING_NOT_FOUND
        </p>
      </motion.div>
    </div>
  );
}
