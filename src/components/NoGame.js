"use client";

export default function NoGame() {
  return (
    <div className="flex h-full justify-center items-center">
      <div>
        <div className="flex justify-center">
          <img src="/nogame.png" className="w-70" />
        </div>

        <p className="font-bold p-2 text-[#808080] text-center">
          Game not listed yet. Check back later.
        </p>
      </div>
    </div>
  );
}