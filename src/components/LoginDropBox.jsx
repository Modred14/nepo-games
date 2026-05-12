"use client";

import { useState, useEffect } from "react";
import { Clock, ShieldAlert } from "lucide-react";

export default function LoginDropBox({ conversationId, listingId }) {
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await fetch(
          `/api/c/${listingId}/checkdetails?conversationId=${conversationId}&listingId=${listingId}`,
        );
        const data = await res.json();

        if (data.exists) {
          setSubmitted(true);
        }
      } catch (err) {
        console.error("Check failed:", err.message);
      } finally {
        setChecking(false);
      }
    };

    checkExisting();
  }, [conversationId, listingId]);
  const handleSubmit = async () => {
    if (!details.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/c/${listingId}/senddetails?conversationId=${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            details,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      if (data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return null;
    if (checking) return null;


  return (
    <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-sm space-y-3">
      <div className="flex items-start gap-2 text-yellow-700 text-sm bg-yellow-50 p-2 rounded-md border border-yellow-200">
        <ShieldAlert size={16} />
        <p>
          The buyer has made payment. Kindly provide the login details to
          receive your payment.
        </p>
      </div>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Paste login details here..."
        className="w-full border rounded-lg p-3 text-sm min-h-[100px] resize-none outline-none focus:border-blue-500"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-sm text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Submitting..." : "Send Login Details"}
      </button>

      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Clock size={14} />
        Auto-expires in 30 minutes after buyer view it
      </div>
    </div>
  );
}
