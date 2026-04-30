"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus("error");
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
      }
    };

    verifyPayment();
  }, [reference]);

  if (status === "loading") return <Loader />;

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-red-600">
          Payment Verification Failed
        </h1>
        <p className="text-gray-600 mt-2">
          Something went wrong. Please contact support.
        </p>

        <button
          onClick={() => router.push("/pricing")}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold text-green-600">
        Payment Successful 🎉
      </h1>
      <p className="text-gray-600 mt-2">
        Your subscription has been activated successfully.
      </p>

      <button
        onClick={() => router.push("/marketplace")}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Go to Marketplace
      </button>
    </div>
  );
}