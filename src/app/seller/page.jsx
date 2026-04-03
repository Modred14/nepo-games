"use client";

import { useState } from "react";
import Reveal from "../reveal";
import { Check, Plus, DollarSign, User2, ArrowRight } from "lucide-react";

export default function Seller() {
  const [step, setStep] = useState(1);
  const [userNumber, SetUserNumber] = useState("")

  const steps = [
    {
      icon: User2,
      header: "Create your sellers profile",
      sub: "Fill out your details to start your journey as a seller",
    },
    {
      icon: Check,
      header: "Verify your identity ",
      sub: "Complete verification process to ensure account security",
    },
    {
      icon: Plus,
      header: "List your Gaming Accounts ",
      sub: "Post your gaming account for sale",
    },
    {
      icon: DollarSign,
      header: "Start selling & Earn Money ",
      sub: "Sell your account securely and earn easily.",
    },
  ];
  const handleJoin = () => {
    setStep(2);
  };

  return (
    <Reveal>
      <div>
        {step === 1 && (
          <div className="py-7 sm:px-10 px-5 min-w-full">
            <p className="text-[#0000FF] text-3xl">Become a Seller</p>
            <p className="py-2">Start selling your games on our marketplace</p>
            <div className="bg-[#DFE1FF] rounded-xl grid md:grid-cols-[1.5fr_1fr] min-w-full gap-4 border border-[#8789FE] py-10 px-5">
              <div className="border flex flex-col items-center justify-center rounded-xl bg-white border-[#8789FE] p-4">
                <div className="relative">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    return (
                      <div key={index} className="flex gap-3 relative">
                        {/* LEFT SIDE: ICON + LINE */}
                        <div className="flex flex-col items-center relative">
                          <div className="bg-[#0000FF] rounded-full p-1 z-10">
                            <Icon size={22} className="text-white" />
                          </div>

                          {/* connector line */}
                          {!isLast && (
                            <div className="w-0.5 bg-[#8789FE] flex-1 mt-1" />
                          )}
                        </div>

                        {/* RIGHT SIDE: CONTENT */}
                        <div className="pb-6">
                          <p className="text-[#0000FF] font-semibold">
                            {step.header}
                          </p>
                          <p className="text-sm text-gray-600">{step.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap items-center justify-center gap-2 ">
                  <button
                    onClick={handleJoin}
                    className="flex text-white items-center text-sm sm:text-base bg-[#0000FF] px-4 py-3 rounded-xl gap-3"
                  >
                    Apply as a seller <ArrowRight size={20} />
                  </button>

                  <div className="text-sm">
                    <p>Any question?</p>
                    <p className="text-[#0000ff]">Contact customer support</p>
                  </div>
                </div>
              </div>
              <div className="border hidden md:flex items-center justify-center  rounded-xl border-[#8789FE]">
                <img src="/sell.png"  className="w-6/10" alt="" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
