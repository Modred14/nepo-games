"use client";
import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className = "",
  once = true,
  rootMargin = "0px 0px -5% 0px", 
  mountOnEnter = false, 
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(!mountOnEnter);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          setMounted(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { root: null, threshold: 0.15, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once, rootMargin]);

  if (!mounted) return <div ref={ref} className={className} />;

  return (
    <div
      ref={ref}
      className={[
        className,
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
