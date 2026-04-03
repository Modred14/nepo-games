"use client";

import { useState } from "react";
import ImageSlider from "@/components/ImageSlider";
import { ShoppingCart, Star } from "lucide-react";
import PageLoader from "@/components/PageLoader";

export default function GameClient({ game, images, similarGames }) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");

  function formatGamePrice(price) {
    return Number(price).toLocaleString();
  }
  function capitalizeFirst(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  const handleReport = (reason) => {
    if (reason === "Others") {
      setSelectedReason("Others");
      return;
    }
    setMessage(
      `You've reported ${game.username} for ${reason}. We will review it.`,
    );
    setReport(true);
  };
  const handleCustomSubmit = () => {
    if (!customReason.trim()) return;

    setMessage(
      `You've reported ${game.username} for ${customReason}. We will review it.`,
    );
    setReport(true);
  };
  const reasons = [
    "Abusive or Inappropriate Language",
    "Fraudulent Listing",
    "Impersonating Account",
    "Scam Attempt",
    "Others",
  ];

  return (
    <PageLoader>
      <div className="w-full flex px-2 justify-center"></div>{" "}
      <div className="p-[3%]">
        <div className="md:grid grid-cols-[2fr_1fr]  gap-7">
          <div className="grid h-fit gap-4">
            <ImageSlider images={images} index={index} setIndex={setIndex} />
            <div className="text-sm  sm:text-base px-[5%] xs:px-[10%] py-4">
              {" "}
              <button className="w-full px-2 bg-[#4A4BFF] rounded-md gap-2 text-white py-2 flex justify-center items-center">
                <ShoppingCart size={15} /> Buy account now (₦{" "}
                {formatGamePrice(game.price)})
              </button>
            </div>
            <div className="h-fit md:mb-0 mb-4 border border-blue-500/40 rounded-xl shadow-sm p-4 sm:min-w-60 lg:min-w-70">
              {/* Header */}
              <p className="text-[#0000FF] font-semibold text-sm mb-3">
                Account information
              </p>

              {/* Content */}
              <div className="bg-[#E6E6FF] rounded-md overflow-hidden">
                <div className="py-3 px-3 border-b border-gray-500/50">
                  <p className="text-sm">
                    <span className="font-bold text-[#0000FF]">Game:</span>{" "}
                    <span className="text-gray-800">{game.title}</span>
                  </p>
                </div>

                <div className="py-3 px-3 border-b border-gray-500/50">
                  <p className="text-sm">
                    <span className="font-bold text-[#0000FF]">Platform:</span>{" "}
                    <span className="text-gray-800">
                      {capitalizeFirst(game.platform)}
                    </span>
                  </p>
                </div>

                <div className="py-3 px-3 border-b border-gray-500/50">
                  <p className="text-sm">
                    <span className="font-bold text-[#0000FF]">
                      Account Price:
                    </span>{" "}
                    <span className="text-gray-800 font-medium">
                      ₦ {formatGamePrice(game.price)}
                    </span>
                  </p>
                </div>

                <div className="py-3 px-3">
                  <p className="text-sm">
                    <span className="font-bold text-[#0000FF]">
                      Description:
                    </span>
                  </p>

                  <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                    {game.description}
                  </p>
                </div>
              </div>
              <div className="bg-[#E6E6FF]  rounded-md overflow-hidden mt-3 py-3 px-3">
                <p className="text-sm">
                  <span className="font-bold text-[#0000FF]">
                    Payment Protection
                  </span>
                </p>

                <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                  Your payment is held until account delivered to the buyer.
                </p>
              </div>
            </div>
          </div>{" "}
          {/* SELLER */}
          <div className="h-fit grid gap-4">
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
                  <p className="font-semibold text-[#0000FF]">
                    {game.username}
                  </p>
                </div>

                <img
                  src={game.profile_image}
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
                      <span className="font-medium text-green-600">
                        Excellent
                      </span>
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
            <div className="h-fit border border-blue-500/40 rounded-xl shadow-sm sm:min-w-60 lg:min-w-70 overflow-hidden">
              {/* Header */}
              <p className="font-bold border-b flex p-3 justify-center text-[#0000FF]/80">
                REPORT SELLER
              </p>

              {/* Body */}
              {!report ? (
                <div className="p-3 space-y-3">
                  {/* Reason List OR Custom Reason */}
                  {selectedReason === "Others" ? (
                    <div className="w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
                      {/* Helper text */}
                      <p className="text-sm text-gray-500">
                        Please describe the issue clearly so we can review it
                        faster.
                      </p>

                      {/* Textarea */}
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="E.g. This listing is a scam, seller is unresponsive..."
                          rows={4}
                          className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none resize-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Be specific</span>
                          <span>{customReason.length}/200</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedReason(null);
                            setCustomReason("");
                          }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={handleCustomSubmit}
                          disabled={customReason.trim().length < 10}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition
                ${
                  customReason.trim().length < 10
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                        >
                          Submit Report
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Reason Buttons */
                    <div className="space-y-2">
                      {reasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => handleReport(reason)}
                          className="w-full flex justify-between items-center py-2.5 px-3 border border-[#cbcbe1] bg-[#E6E6FF] hover:bg-[#ceceea] transition rounded-md"
                        >
                          <span className="text-sm">{reason}</span>
                          <span className="text-lg font-semibold text-[#0000FF]">
                            &gt;
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                  <div className="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center text-2xl mb-4">
                    ✓
                  </div>

                  <h2 className="text-lg font-semibold mb-2">
                    Report Submitted
                  </h2>

                  <p className="text-sm text-gray-600 max-w-xs">{message}</p>

                  <button
                    onClick={() => {
                      setReport(false);
                      setSelectedReason(null);
                      setCustomReason("");
                    }}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-4">
              <div className="flex justify-between">
                {" "}
                <p className="font-semibold">Similar Accounts</p>
                <a href="/marketplace">
                  <button className="text-[#0000FF] text-sm px-3 rounded py-1 bg-[#C4C6FF]">
                    View All
                  </button>
                </a>
              </div>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-3">
                  {similarGames.map((game, index) => (
                    <div key={index}>
                      <div className="border rounded-md border-[#4F8CFF] overflow-hidden">
                        {/* Verified Badge */}
                        {game.verified && (
                          <div className="absolute mt-2 ml-2">
                            <div className="flex py-0.5 px-2 rounded-2xl bg-green-100 text-xs text-green-800 items-center gap-1">
                              Verified
                              <Verified
                                className="fill-green-600 text-green-100"
                                size={14}
                              />
                            </div>
                          </div>
                        )}

                        {/* Image */}
                        <img
                          src={`/${game.cover_image}`}
                          className="w-full h-50 object-cover border-[#4F8CFF] border-b rounded-t-[4.5px] "
                          alt=""
                        />

                        {/* Info */}
                        <div className="px-2 py-2 flex justify-between items-center">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0000FF] truncate">
                              {game.title}
                            </p>
                            <p className="text-sm text-gray-900">
                              ₦ {formatGamePrice(game.price)}
                            </p>
                          </div>

                          <a href={`/game/${game.slug}`}>
                            <button className="flex  text-white p-1.5 rounded-lg border border-[#0038C9] bg-linear-to-b from-[#4F8CFF] to-[#8A38F5] b items-center gap-1 sm:text-sm text-xs">
                              Buy{" "}
                              <ShoppingCart
                                size={14}
                                className="text-white fill-white"
                              />
                            </button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLoader>
  );
}
