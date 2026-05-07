"use client";

import { useState } from "react";
import { Clock, ShieldAlert } from "lucide-react";

export default function LoginDropBox({ conversationId, listingId }) {
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!details.trim()) return;

    setLoading(true);
    console.log(conversationId);

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
