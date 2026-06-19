"use client";

import Image from "next/image";
import { useMemo } from "react";

const games = [
  { name: "Delta Force", logo: "/deltaforce_512.png" },
  { name: "Efootball", logo: "/efootball_512.png" },
  { name: "Mobile Legends", logo: "/mobile_legends_512.png" },
  { name: "Call Of Duty Mobile", logo: "/call_of_duty_512.png" },
  { name: "Fortnite", logo: "/fortnite_512.png" },
  { name: "Minecraft", logo: "/minecraft_512.png" },
  { name: "Pubg Mobile", logo: "/pubg_512.png" },
  { name: "Gameloft", logo: "/gameloft_512.png" },
  { name: "Free Fire", logo: "/freefire.png" },
  { name: "Blood Strike", logo: "/bloodstrike.png" },
];

export default function Marquee() {
  const items = useMemo(() => [...games, ...games], []);

  return (
   <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#2563EB]">
  {/* Smooth fade edges */}
  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 md:w-24 lg:w-32 bg-gradient-to-r from-[#2563EB] via-[#2563EB]/90 to-transparent" />
  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 md:w-24 lg:w-32 bg-gradient-to-l from-[#2563EB] via-[#2563EB]/90 to-transparent" />

  <div className="flex w-max animate-marquee items-center">
    {items.map((game, i) => (
      <div
        key={`${game.name}-${i}`}
        className="group mx-4 sm:mx-6 md:mx-8 lg:mx-10 flex shrink-0 items-center justify-center"
      >
        <Image
          src={game.logo}
          alt={game.name}
          width={90}
          height={90}
          draggable={false}
          priority
          className="
            opacity-60
            brightness-0
            invert
            grayscale
            transition-all duration-300 ease-out

            group-hover:opacity-100
            group-hover:grayscale-0
            group-hover:brightness-100
            group-hover:invert-0
            group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]
          "
        />
      </div>
    ))}
  </div>
</div>
  );
}