"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function ErrorModal({
  isOpen,
  message,
  triggerId,
  onClose,
  autoClose = false,
  autoCloseDuration = 10000,
}) {
  useEffect(() => {
    if (!autoClose || !isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [triggerId, autoClose, autoCloseDuration, isOpen, onClose]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-title"
      aria-describedby="error-message"
      className=" z-50 flex items-center justify-center "
    >
      <div className="relative mb-4 w-full max-w-md bg-white/10 backdrop-blur-xl border border-red-400/40 rounded-xl px-3 pt-6 animate-fadeIn">
        {/* Close Button */}
        <div className="flex gap-2 text-center justify-center">
          <button
            onClick={onClose}
            aria-label="Close error"
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-300/20 hover:bg-red-500 transition duration-300 group"
          >
            <X
              size={14}
              className="text-red-700 group-hover:text-white transition"
            />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-6 h-6 flex items-center justify-center bg-red-500/20 rounded-full border border-red-400/40">
              <span className="text-red-500 text-base font-bold">!</span>
            </div>
          </div>

          {/* Message */}
          <p
            id="error-message"
            className="text-center pb-4 text-red-600 text-base leading-relaxed"
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
