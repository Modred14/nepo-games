"use client";

const features = [
  "Lower selling fees on every transaction",
  "Top placement in search results",
  "Featured listings on homepage",
  "“Verified Seller” badge (build buyer trust)",
  "Faster payouts",
  "Priority dispute resolution",
  "Advanced sales & performance analytics",
  "Access to high-value buyers",
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

export default function PricingPage() {
  const handleUpgrade = async (plan) => {
  const res = await fetch("/api/paystack/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  }
};
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-600 mt-2">No contracts. Cancel anytime.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-2xl border hover:scale-102 duration-300 transition-all shadow-lg p-6 flex flex-col justify-between ${
              plan.name === "Free"
                ? "bg-gray-200 border-black/20"
                : "bg-linear-to-b border-black/20 from-blue-700 to-blue-900 text-white"
            }`}
          >
            <div>
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-sm opacity-80 mb-4">
                Same benefits, different duration
              </p>

              <h3 className="text-3xl font-bold">
                {plan.price}
                <span className="text-sm ml-1">{plan.duration}</span>
              </h3>

              <hr
                className={`my-4  ${
                  plan.name === "Free" ? "border-white/60 " : "border-white/20"
                }`}
              />

              <ul className="space-y-2 text-sm">
                {plan.type === "free" ? (
                  <>
                    <li>✔ List and sell game accounts</li>
                    <li>✔ Standard visibility in search results</li>
                    <li>✔ Basic seller profile</li>
                    <li>✔ Platform-secured transactions</li>
                    <li>✔ Standard withdrawal speed</li>
                    <li>✔ Basic support access</li>
                  </>
                ) : (
                  features.map((item, i) => <li key={i}>✔ {item}</li>)
                )}
              </ul>
            </div>

            <button
              className={`mt-6 rounded-lg py-2 transition ${
                plan.name === "Free"
                  ? "border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  : "bg-gray-200 text-blue-800 hover:bg-white"
              }`}
              onClick={() => handleUpgrade(plan.name.toLowerCase())}
            >
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
