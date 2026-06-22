"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Link from "next/link";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState("loading");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus("error");
        setTimeout(() => setVisible(true), 50);
        return;
      }
      try {
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      } finally {
        setTimeout(() => setVisible(true), 50);
      }
    };
    verifyPayment();
  }, [reference]);

  if (status === "loading") return <Loader />;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .scale-in { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .ripple {
          position: absolute; inset: 0; border-radius: 9999px;
          animation: ripple 1.8s ease-out infinite;
        }
        .ps-btn {
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .ps-btn:hover { opacity: 0.88; transform: scale(1.02); }
        .ps-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center fade-up"
          style={{ animationDelay: "0ms" }}
        >
          {status === "success" ? (
            <>
              {/* Icon */}
              <div className="relative flex items-center justify-center mb-8">
                <div className="ripple bg-green-400" style={{ animationDelay: "0s" }} />
                <div className="ripple bg-green-300" style={{ animationDelay: "0.6s" }} />
                <div className="relative z-10 w-20 h-20 rounded-full bg-green-500 flex items-center justify-center scale-in" style={{ animationDelay: "100ms" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2 fade-up" style={{ animationDelay: "150ms" }}>
                Payment confirmed
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 fade-up" style={{ animationDelay: "200ms" }}>
                You&apos;re all set!
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 fade-up" style={{ animationDelay: "250ms" }}>
                Your subscription has been activated. Start selling smarter with your new plan benefits.
              </p>

              <div className="fade-up" style={{ animationDelay: "300ms" }}>
                <Link href="/marketplace">
                  <button className="ps-btn w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm">
                    Go to Marketplace
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="ps-btn mt-3 w-full text-gray-400 text-sm py-2">
                    View my plan
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Error icon */}
              <div className="relative flex items-center justify-center mb-8">
                <div className="ripple bg-red-300" style={{ animationDelay: "0s" }} />
                <div className="relative z-10 w-20 h-20 rounded-full bg-red-500 flex items-center justify-center scale-in" style={{ animationDelay: "100ms" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>

              <p className="text-xs font-semibold tracking-widest text-red-500 uppercase mb-2 fade-up" style={{ animationDelay: "150ms" }}>
                Verification failed
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 fade-up" style={{ animationDelay: "200ms" }}>
                Something went wrong
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 fade-up" style={{ animationDelay: "250ms" }}>
                We couldn&apos;t verify your payment. This can happen if the session expired. Please contact support if the issue persists.
              </p>

              <div className="fade-up" style={{ animationDelay: "300ms" }}>
                <Link href="/pricing">
                  <button className="ps-btn w-full bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm">
                    Back to Pricing
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}