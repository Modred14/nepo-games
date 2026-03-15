"use client";

import { useEffect } from "react";
import { X, Check } from "lucide-react";

export default function SuccessModal({
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
      role="dialog"
      aria-modal="true"
      aria-describedby="success-message"
      className="z-50 mb-3 flex items-center justify-center backdrop-blur-sm"
    >
      <div className="relative mb-4 w-full max-w-md bg-white/10 backdrop-blur-xl border border-green-400/40 rounded-xl px-3 pt-6 animate-fadeIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close message"
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-green-300/20 hover:bg-green-500 transition duration-300 group"
        >
          <X size={14} className="text-green-700 group-hover:text-white transition" />
        </button>

        <div className="flex justify-center gap-2">

          {/* Success Icon */}
          <div className="w-6 h-6 flex items-center justify-center bg-green-500/20 rounded-full border border-green-400/40">
            <Check size={14} className="text-green-500" />
          </div>

          {/* Message */}
          <p
            id="success-message"
            className="text-green-600 text-base leading-relaxed pb-4"
          >
            {message}
          </p>

        </div>
      </div>
    </div>
  );
}