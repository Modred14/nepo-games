"use client";

import { useState } from "react";

export default function ImageSlider({ images }) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const next = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full">
      {/* MAIN IMAGE */}
      <div className="relative w-full  xl:h-100  aspect-video border-2 flex justify-center items-center bg-gray-200 border-blue-600/60 rounded-md overflow-hidden">
    <img
  src={images[index]}
  alt=""
  className="w-full h-full object-contain"
/>

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
            onClick={() => setIndex(i)}
            className={`items-center bg-gray-200 flex cursor-pointer border-2 rounded overflow-hidden ${
              i === index ? "border-blue-600/60" : "border-gray-300"
            }`}
          >
            <img src={img} alt="" className="max-h-35 w-full " />
          </div>
        ))}
      </div>
    </div>
  );
}
