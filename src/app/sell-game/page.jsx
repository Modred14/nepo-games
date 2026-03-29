"use client";

import { useState, useEffect } from "react";
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
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("idle");
  const [timer, setTimer] = useState(10);
  const [images, setImages] = useState([]);
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (images.length >= 5) {
      alert("You can only upload 5 images.");
      return;
    }

    const tempId = Date.now();

    const newImage = {
      id: tempId,
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    };

    setImages((prev) => [...prev, newImage]);

    // simulate upload delay (replace with real API later)
    setTimeout(() => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId ? { ...img, uploading: false } : img,
        ),
      );
    }, 1500);

    e.target.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);

      return prev.filter((img) => img.id !== id);
    });
  };

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

      const user = JSON.parse(localStorage.getItem("nepo-user"));

      if (!user?.id) {
        alert("You are not logged in");
        setStep("ready");
        return;
      }

      const formData = new FormData();

      formData.append("user_id", user.id);
      formData.append("title", selectedGame);
      formData.append("description", description);
      formData.append("price", amount);
      formData.append("platform", platform);
      formData.append("cover_image", gameData[selectedGame]);

      images.forEach((img) => {
        formData.append("images", img.file);
      });

      fetch("/api/listings", {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);

          if (!res.ok) {
            // THIS is the real fix
            throw new Error(
              data?.error ||
                data?.message ||
                `Request failed with ${res.status}`,
            );
          }
          setSlug(data.listing.slug);
          return data;
        })
        .then((data) => {
          setSuccess(true);
          setImages([]);
          setSelectedGame("");
          setPlatform("");
          setDescription("");
          setAmount("");
          setStep("idle");
          setTimer(10);
        })
        .catch((err) => {
          console.error(err);
          alert("Something broke");
          setStep("ready");
        });
    }
  };

  return (
    <div className="flex min-h-screen sm:px-[2%] sm:p-15 justify-center items-center">
      <div className="sm:border py-20 p-10 sm:p-10 sm:shadow-lg rounded-2xl border-[#0000FFE0]/88 w-full max-w-2xl">
        {!success ? (
          <form onSubmit={handleClick}>
            <div className={success ? "hidden" : ""}>
              {images.length !== 5 && (
                <p className="text-red-500 text-center pb-3 text-sm">
                  Upload exactly <span className="font-bold">5 images</span>{" "}
                  showing all details of the game account before proceeding.
                  These images will be visible to buyers,{" "}
                  <span className="font-bold">
                    do not include any sensitive information.
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {images.map((img, index) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.preview}
                    alt={`preview-${index}`}
                    className={`w-20 h-20 sm:w-25 sm:h-25 mb-3 object-cover rounded-lg border
          ${img.uploading ? "opacity-40" : "opacity-100"}
        `}
                  />

                  {/* LOADING SPINNER */}
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  )}

                  {/* REMOVE BUTTON (disable while uploading) */}
                  <button
                    type="button"
                    disabled={isLocked || img.uploading}
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="flex flex-col items-center justify-center gap-6">
                <label className="h-full w-50 mt-2 p-2 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition">
                  {images.length < 5 && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      required
                      disabled={isLocked}
                      className="hidden"
                    />
                  )}
                  <img src="/upload.png" className="w-30" alt="" />
                  <p className="text-[#4F8CFF] text-sm font-medium">
                    {images.length < 5
                      ? `Upload image (${images.length}/5)`
                      : "Max 5 images"}
                  </p>
                </label>{" "}
              </div>{" "}
              <div className="hidden sm:block">
                <p className="pb-1">Description</p>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLocked}
                  className="w-full p-2 rounded-lg border border-blue-600/40 min-h-30 resize-none"
                  placeholder="Enter additional details i.e rank, skins, etc"
                />
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
              <div className="hidden sm:block">
                <p className="pb-1">Price (₦)</p>
                <div className="relative">
                  <p className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₦
                  </p>

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 pl-8 rounded-lg border border-blue-600/40"
                    placeholder="Enter Amount"
                    required
                    disabled={isLocked}
                  />
                </div>
              </div>
              <div className="sm:hidden ">
                <p className="pb-1">Price (₦)</p>
                <div className="relative">
                  <p className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₦
                  </p>

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 pl-8 rounded-lg border border-blue-600/40"
                    placeholder="Enter Amount"
                    required
                    disabled={isLocked}
                  />
                </div>
              </div>
              <div className="sm:hidden ">
                <p className="pb-1">Description</p>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLocked}
                  className="w-full p-2 rounded-lg border border-blue-600/40 min-h-30 resize-none"
                  placeholder="Enter additional details i.e rank, skins, etc"
                />
              </div>
              <div className="flex items-center sm:h-24.5">
                {/* DESCRIPTION */}
                <button
                  type="submit"
                  disabled={step === "confirming" || step === "submitting"}
                  className={`w-full h-10.25 p-2 rounded-lg text-white transition flex items-center justify-center gap-2
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

                  {step === "ready" && "List Account"}

                  {step === "submitting" && (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Listing...
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
            {/* Success Emoji */}
            <div className="text-6xl">🎉</div>

            {/* Message */}
            <h2 className="text-2xl font-bold text-green-600">
              Game Listed Successfully!
            </h2>

            <p className="text-gray-500 text-sm max-w-sm">
              Your game account has been successfully listed. You can view it or
              list another one.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              {/* VIEW DETAILS */}
              <button
                onClick={() => {
                  // replace with actual slug logic
                  window.location.href = `/listing/${slug}`;
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                View Details
              </button>

              {/* LIST ANOTHER */}
              <button
                onClick={() => {
                  setSuccess(false);
                  setSlug("");
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                List Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
