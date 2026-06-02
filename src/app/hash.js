"use client";
import { useEffect } from "react";

export default function HashScrollHandler() {
  useEffect(() => {
    const scrollToHash = (hash) => {
      if (!hash) return;

      // Normalize — ensure it starts with #
      const selector = hash.startsWith("#") ? hash : `#${hash}`;

      // Retry up to 10 times in case element isn't mounted yet
      let attempts = 0;
      const tryScroll = () => {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (attempts < 10) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };

      tryScroll();
    };

    // Handle initial page load with hash in URL
    if (window.location.hash) {
      // Wait for full paint before scrolling
      requestAnimationFrame(() => {
        setTimeout(() => scrollToHash(window.location.hash), 400);
      });
    }

    // Handle anchor clicks
   const handleClick = (e) => {
  const anchor = e.target.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href");

  // Handle both "#faq" and "/#faq"
  const isHashOnly = href?.startsWith("#");
  const isRootHash = href?.startsWith("/#");

  if (!isHashOnly && !isRootHash) return;

  e.preventDefault();

  const hash = isRootHash ? href.slice(1) : href; // "/#faq" → "#faq"

  // If already on home page, scroll directly
  if (window.location.pathname === "/") {
    history.pushState(null, "", hash);
    scrollToHash(hash);
  } else {
    // Navigate to home, hash will fire on mount
    window.location.href = href;
  }
};

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}