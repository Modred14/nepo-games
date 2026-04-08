"use client";

import { useState, useEffect, useRef } from "react";

const DURATION = 5000; // 5 seconds

export default function ImageSlider({ images }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef(Date.now());
  const animationRef = useRef(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  if (!images || images.length === 0) return null;

  const next = () => {
    setIndex((prev) => (prev + 1) % images.length);
    startTimeRef.current = Date.now();
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
    startTimeRef.current = Date.now();
  };

  // 🔥 SINGLE LOOP (perfect sync)
  useEffect(() => {
    const animate = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const percent = (elapsed / DURATION) * 100;

        if (percent >= 100) {
          next();
        } else {
          setProgress(percent);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused]);

  // reset progress when slide changes
  useEffect(() => {
    setProgress(0);
  }, [index]);

  // SWIPE
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (diff > 50) next();
    if (diff < -50) prev();
  };

  return (
    <div className="w-full">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          startTimeRef.current = Date.now() - (progress / 100) * DURATION;
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full xl:h-100 aspect-video border-2 flex justify-center items-center bg-gray-200 border-blue-600/60 rounded-md overflow-hidden"
      >
        {/* IMAGE */}
        <img
          key={index}
          src={images[index]}
          alt=""
          className="w-full h-full object-contain absolute inset-0 transition-opacity duration-700 ease-in-out"
        />

        {/* PERFECTLY SYNCED PROGRESS */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-300/40">
          <div
            className="h-full bg-blue-600/80"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* LEFT */}
        <button
          onClick={prev}
          className="absolute left-2 sm:text-2xl top-1/2 -translate-y-1/2 bg-black/60 text-white px-2 py-1 rounded"
        >
          ‹
        </button>

        {/* RIGHT */}
        <button
          onClick={next}
          className="absolute right-2 sm:text-2xl top-1/2 -translate-y-1/2 bg-black/60 text-white px-2 py-1 rounded"
        >
          ›
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => {
              setIndex(i);
              startTimeRef.current = Date.now();
            }}
            className={`items-center bg-gray-200 flex cursor-pointer border-2 rounded overflow-hidden ${
              i === index ? "border-blue-600/60" : "border-gray-300"
            }`}
          >
            <img src={img} alt="" className="max-h-35 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}