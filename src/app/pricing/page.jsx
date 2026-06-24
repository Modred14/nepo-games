"use client";

import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const features = [
  "Low selling fees on every transaction",
  "Priority placement in search results",
  "Featured listings on homepage",
  "Verified Seller badge for buyer trust",
  "Fast-track payouts (get paid quicker)",
  "Priority dispute resolution",
  "Advanced sales & performance analytics",
  "Access to high-intent, high-value buyers",
  "Withdraw funds anytime, instantly",
];

const plans = [
  {
    name: "Free",
    price: "0",
    duration: "/ month",
    type: "free",
    button: "Get Started for free",
  },
  {
    name: "Pro",
    price: "2,900",
    duration: "/ month",
    type: "paid",
    button: "Upgrade to Pro",
  },
  {
    name: "Plus",
    price: "8,500",
    duration: "/ 3 months",
    type: "paid",
    button: "Upgrade to Plus",
  },
  {
    name: "Premium",
    price: "32,000",
    duration: "/ year",
    type: "premium",
    button: "Upgrade to Premium",
  },
];
function derivePlan(subscription_start, subscription_end, subscription_status) {
  if (!subscription_start || !subscription_end || subscription_status !== "active") {
    return "free";
  }

  // Check if subscription has expired
  if (new Date(subscription_end) < new Date()) return "free";

  const start = new Date(subscription_start);
  const end = new Date(subscription_end);
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 30) return "pro";
  if (days <= 90) return "plus";
  if (days <= 365) return "premium";

  return "free";
}

export default function PricingPage() {
  const [load, setLoad] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setLoad(false);
        setTimeout(() => setVisible(true), 50);
      }
    };
    fetchUser();
  }, []);

  const currentPlan = derivePlan(
    user?.subscription_start,
    user?.subscription_end,
    user?.subscription_status,
  );

  const handleUpgrade = async (plan) => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("tournament_return_url", currentPath);
      router.push("/login");
      return;
    }
    if (!user.phone_verified) {
      router.push("/seller");
      return;
    }
  if (currentPlan === plan) return;  
    try {
      setUpgrading(true);
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgrading(false);
        throw new Error(data.error || "Something went wrong");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpgrading(false);
        throw new Error("No payment link returned");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(err.message);
      setUpgrading(false);
    }
  };

  if (load || upgrading) return <Loader />;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pricing-fade-up {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .pricing-card {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
        }
        .pricing-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12);
        }
        .pricing-btn {
          transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .pricing-btn:not(:disabled):hover {
          transform: scale(1.02);
        }
        .pricing-btn:not(:disabled):active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20 px-4 bg-gray-50">
        {/* Header */}
        <div
          className="text-center mb-14 pricing-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Seller Plans
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto text-base leading-relaxed">
            Upgrade anytime — your remaining subscription time is automatically
            carried over to your new plan.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl">
          {plans.map((plan, index) => {
            const isFree = plan.name === "Free";
            const isCurrent = currentPlan === plan.name.toLowerCase();

            return (
              <div
                key={index}
                className={`pricing-card pricing-fade-up rounded-2xl flex flex-col justify-between overflow-hidden ${
                  isFree
                    ? "bg-white border border-gray-200 shadow-sm"
                    : "bg-gray-900 border border-gray-800 shadow-xl text-white"
                }`}
                style={{ animationDelay: `${100 + index * 80}ms` }}
              >
                {/* Card top accent line */}
                {!isFree && (
                  <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" />
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan name + badge */}
                  <div className="flex items-center justify-between mb-1">
                    <h2
                      className={`text-base font-semibold ${isFree ? "text-gray-800" : "text-white"}`}
                    >
                      {plan.name}
                    </h2>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs mb-5 ${isFree ? "text-gray-400" : "text-gray-400"}`}
                  >
                    {isFree
                      ? "Start selling with no upfront cost"
                      : "Same benefits, flexible billing"}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      {!isFree && (
                        <span
                          className={`text-sm mb-1 ${isFree ? "text-gray-500" : "text-gray-400"}`}
                        >
                          ₦
                        </span>
                      )}
                      <span
                        className={`text-4xl font-bold tracking-tight ${isFree ? "text-gray-900" : "text-white"}`}
                      >
                        {plan.price}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${isFree ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {plan.duration}
                    </span>
                  </div>

                  <hr
                    className={`mb-5 ${isFree ? "border-gray-100" : "border-white/10"}`}
                  />

                  {/* Features */}
                  <ul className="space-y-2.5 text-sm flex-1">
                    {isFree ? (
                      <>
                        {[
                          "List and sell game accounts",
                          "Standard visibility in search results",
                          "Basic seller profile",
                          "Platform-secured transactions",
                          "Withdraw funds anytime",
                          "Basic customer support access",
                        ].map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-gray-600"
                          >
                            <span className="mt-0.5 text-blue-500 shrink-0">
                              ✓
                            </span>
                            {item}
                          </li>
                        ))}
                      </>
                    ) : (
                      features.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <span className="mt-0.5 text-blue-400 shrink-0">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))
                    )}
                  </ul>

                  {/* CTA */}
                  <button
                    disabled={isCurrent}
                    className={`pricing-btn mt-6 w-full rounded-xl py-2.5 text-sm font-semibold ${
                      isCurrent
                        ? "bg-green-500 text-white cursor-not-allowed opacity-80"
                        : isFree
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-blue-600 text-white hover:bg-blue-500"
                    }`}
                    onClick={() => handleUpgrade(plan.name.toLowerCase())}
                  >
                    {isCurrent ? "Current Plan" : plan.button}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p
          className="mt-10 text-xs text-gray-400 text-center pricing-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          All plans include platform-secured transactions. Prices are in
          Nigerian Naira (₦).
        </p>
      </div>
    </>
  );
}
