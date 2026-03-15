"use client";

import useAuthGuard from "../hooks/useAuthGuard";
import PageLoader from "@/components/PageLoader";

export default function Marketplace() {
  useAuthGuard();

  return (
    <PageLoader>
      <div>
        <h1>Welcome to Marketplace</h1>
        {/* protected content */}
      </div>
    </PageLoader>
  );
}
