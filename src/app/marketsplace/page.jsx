"use client";

import useAuthGuard from "../hooks/useAuthGuard";

export default function Marketplace() {
  useAuthGuard();

  return (
    <div>
      <h1>Welcome to Marketplace</h1>
      {/* protected content */}
    </div>
  );
}