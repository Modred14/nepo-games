"use client";
import Image from "next/image";
export default function NoGame() {
  return (
    <div className="flex h-full justify-center items-center">
      <div>
        <div className="flex justify-center">
          <Image
            src="/nogame.png"
            alt="No games found"
            width={280}
            height={280}
            className="w-50 sm:w-70"
          />{" "}
        </div>

        <p className="font-bold p-2 text-[#808080] text-center">
          Game not listed yet. Check back later.
        </p>
      </div>
    </div>
  );
}
