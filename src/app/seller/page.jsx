"use client";

import { useState } from "react";

export default function Seller() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 && (
        <div>
          <p>Become a Seller</p>
          <p>Start selling your games on our marketplace</p>
          <div className="py-5 px-3">

          </div>
        </div>
      )}
    </div>
  );
}
