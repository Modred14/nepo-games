"use client";

import { useState } from "react";
import useAuthGuard from "../hooks/useAuthGuard";

const gameData = {
  Efootball: "efootball.png",
  "Call of Duty": "call-of-duty.png",
  "Free Fire": "freefire-ac.png",
  PubG: "pubg.png",
  "Blood Strike": "bloodstrike-ac.png",
  "EA Sports (FIFA)": "fifa.png",
  "  Delta Force": "delta.png",
  " Dream League Soccer": "dls.png",
};

export default function SellGame() {
  useAuthGuard();

  const [selectedGame, setSelectedGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [step, setStep] = useState("idle");

  const [timer, setTimer] = useState(10);
  const [intervalId, setIntervalId] = useState(null);

  const isLocked = step === "submitting";
  const handleClick = (e) => {
    e.preventDefault();

    // START CONFIRMATION
    if (step === "idle") {
      setStep("confirming");
      setTimer(10);

      const id = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            setStep("ready");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    // FINAL SUBMIT (LOADING STATE)
    if (step === "ready") {
      setStep("submitting");

      // simulate API call
      setTimeout(() => {
        alert("Game listed successfully!");

        setStep("idle");
        setTimer(10);
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen px-[2%] justify-center items-center">
      <div className="border p-10 shadow-lg rounded-2xl border-[#0000FFE0]/88 w-full max-w-2xl">
        <form onSubmit={handleClick}>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* PRICE */}
            <div>
              <p className="pb-1">Price (₦)</p>
              <div className="relative">
                <p className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₦
                </p>

                <input
                  type="text"
                  className="w-full p-2 pl-8 rounded-lg border border-blue-600/40"
                  placeholder="Enter Amount"
                  required
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* GAME */}

            <div>
              <p className="pb-1">Game Name</p>
              <select
                className="w-full p-2 rounded-lg border border-blue-600/40"
                value={selectedGame}
                required
                disabled={isLocked}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="">Select a game</option>
                {Object.keys(gameData).map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </select>
              {/* IMAGE PREVIEW */}
              {/* <div className="mt-3">
              <img
                src={`/${gameData[selectedGame]}`}
                alt={selectedGame}
                className="w-24 h-24 object-cover rounded-md border"
              />
            </div>{" "} */}
            </div>
            <div>
              <p className="pb-1">Platform</p>

              <select
                value={platform}
                required
                disabled={isLocked}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-2 rounded-lg border border-blue-600/40"
              >
                <option value="">Select platform</option>
                <option value="mobile">Mobile</option>
                <option value="pc">PC</option>
                <option value="xbox">Xbox</option>
                <option value="playstation">PlayStation</option>
              </select>
            </div>
            <div className="">
              <p className="pb-1">Description</p>
              <textarea
                required
                disabled={isLocked}
                className="w-full p-2 rounded-lg border border-blue-600/40 min-h-[120px] resize-none"
                placeholder="Enter additional details i.e rank, skins, etc"
              />
            </div>

            {/* DESCRIPTION */}
            <button
              onClick="submit"
              disabled={step === "confirming" || step === "submitting"}
              className={`w-full p-2 rounded-lg text-white transition flex items-center justify-center gap-2
    ${
      step === "confirming"
        ? "bg-blue-600 cursor-not-allowed opacity-70"
        : step === "submitting"
          ? "bg-blue-500 opacity-80"
          : "bg-blue-600 hover:bg-blue-700"
    }

  `}
            >
              {step === "idle" && "Submit"}

              {step === "confirming" && `Crosscheck... ${timer}s`}

              {step === "ready" && "Add Game"}

              {step === "submitting" && (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Adding...
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
