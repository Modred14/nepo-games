"use client";

import { useState, useEffect, useRef } from "react";
import Reveal from "../reveal";
import { Check, Plus, DollarSign, User2, ArrowRight } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import useAuthGuard from "../hooks/useAuthGuard";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export default function Seller() {
  useAuthGuard();

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");

    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    console.log(user);
    if (user.phone_verified === true) {
      router.replace("/sell-game");
    }
  }, [router]);

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [errorAdd, setErrorAdd] = useState("");
  const inputs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };
  const distort = (phone) => {
    if (!phone) {
      setError("Phone number is required");
      return "";
    }

    const parsed = parsePhoneNumberFromString(phone);

    if (!parsed || !parsed.isValid()) {
      setError("Invalid phone number format");
      return;
    }

    setError(""); // clear previous errors

    const countryCode = `+${parsed.countryCallingCode}`;
    const digits = parsed.nationalNumber;

    if (digits.length <= 4) {
      return `${countryCode} ${digits}`;
    }

    const start = digits.slice(0, 3);
    const end = digits.slice(-3);
    const masked = "*".repeat(digits.length - 5);

    return `${countryCode} ${start}${masked}${end}`;
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    console.log(code);
    if (!code) {
      setErrorAdd("OTP is required");
      return;
    }

    if (code.length !== 6) {
      setErrorAdd("OTP must be 6 digits");
      return;
    }

    setPhone("");

    setStep(4);
  };

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
  const handleSave = () => {
    setError("");
    if (phone == 0) {
      setError("Phone number is required");
      return;
    }
    const parsed = parsePhoneNumberFromString(phone);

    if (!parsed || !parsed.isValid()) {
      setError("Invalid phone number format");
      return;
    }

    setError(""); // clear previous errors

    const countryCode = `+${parsed.countryCallingCode}`;
    const digits = parsed.nationalNumber;

    if (digits.length <= 4) {
      return `${countryCode} ${digits}`;
    }
    setStep(3);
  };

  return (
    <PageLoader>
      <Reveal>
        <div className="h-svh">
          {step === 1 && (
            <div className="py-7 sm:px-10 px-5 min-w-full">
              <p className="text-[#0000FF] text-3xl">Become a Seller</p>
              <p className="py-2">
                Start selling your games on our marketplace
              </p>
              <div className="bg-[#DFE1FF] rounded-xl grid md:grid-cols-[1.5fr_1fr] min-w-full gap-4 border border-[#8789FE] py-10 px-5">
                <div className="border py-10 flex flex-col items-center justify-center rounded-xl bg-white border-[#8789FE] p-4">
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

                    <div className="text-sm  items-center sm:items-start flex-col flex">
                      <p>Any question?</p>
                      <p className="text-[#0000ff]">Contact customer support</p>
                    </div>
                  </div>
                </div>
                <div className="border hidden md:flex items-center justify-center  rounded-xl border-[#8789FE]">
                  <img src="/sell.png" className="w-6/10" alt="" />
                </div>
              </div>
            </div>
          )}
          {step != 1 && step != 4 && (
            <Reveal>
              <div className="lg:max-h-screen flex overflow-hidden flex-col lg:flex-row bg-white">
               
                <div className="w-full bg-blue-50/20 lg:w-1/2 form-scroll lg:overflow-y-auto flex justify-center px-6 py-30 lg:py-25">
                  {step === 2 && (
                    <div className=" flex items-center justify-center px-4">
                      <div className="w-full max-w-md border border-blue-600/20 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-center">
                          <span className="text-blue-600">Verification</span>{" "}
                          <span className="text-black">of Identity</span>
                        </h1>

                        <p className="text-gray-500 text-center text-sm mt-3 mb-5">
                          Enter your phone number to receive a verification code
                        </p>

                        {/* INPUT */}
                        <div className="mt-2">
                          <PhoneInput
                            country={"ng"}
                            disabled={loading}
                            value={phone}
                            onChange={(value) => setPhone("+" + value)}
                            containerClass="!w-full"
                            inputClass="!w-full !h-[50px] !pl-[60px] !text-sm !rounded-r-md !border !overflow-hidden !border-blue-400 focus:!border-blue-600 focus:!shadow-none"
                            buttonClass="!border-blue-400 hover:!border-r !rounded-l-sm hover:rounded-none focus:!border-blue-600  !bg-transparent "
                            dropdownClass="!rounded-xl !border-blue-400/50 !border !shadow-md"
                          />
                        </div>
                        <p className="text-red-500 mt-2 font-semibold text-sm text-center">
                          {error}
                        </p>
                        {/* BUTTON */}
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="w-full mt-6 h-12.5 rounded-xl bg-[#0000FF] text-white font-medium text-sm hover:bg-[#0000f8] duration-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Processing...
                            </>
                          ) : (
                            "Continue"
                          )}
                        </button>
                      </div>
                    </div>
                  )}{" "}
                  {step === 3 && (
                    <div className=" flex items-center justify-center px-4">
                      <div className="w-full max-w-md border border-blue-600/20 bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
                        <h1 className="text-2xl sm:text-3xl font-semibold">
                          <span className="text-blue-600">Verification</span>{" "}
                          <span>of Identity</span>
                        </h1>

                        <p className="text-gray-500 text-sm mt-3">
                          Verify your identity by confirming the code sent to
                          your phone number
                        </p>

                        {!errorAdd ? (
                          <>
                            {" "}
                            <p className="mt-4 text-sm">
                              Enter the{" "}
                              <span className="text-blue-600 font-medium">
                                6 - Digit code
                              </span>{" "}
                              sent to your phone number
                            </p>
                          </>
                        ) : (
                          <span className="text-red-500 mt-3 font-semibold text-sm text-center block">
                            {errorAdd}
                          </span>
                        )}
                        <p className="mt-2 font-semibold text-lg">
                          {distort(phone)}
                        </p>

                        <div className="flex justify-between mt-6 gap-3">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => (inputs.current[index] = el)}
                              type="text"
                              maxLength="1"
                              value={digit}
                              onChange={(e) =>
                                handleChange(e.target.value, index)
                              }
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              className="w-12 h-12 text-center border border-blue-500 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ))}
                        </div>

                        <button
                          onClick={handleVerify}
                          disabled={loading}
                          className="w-full mt-6 h-12.5 rounded-xl bg-[#0000FF] text-white font-medium text-sm hover:bg-[#0000f8] duration-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Verifying...
                            </>
                          ) : (
                            "Verify"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden lg:flex  border-l-2 border-blue-600 lg:w-1/2 items-center justify-center bg-white">
                  <img
                    src="/phoneno.png"
                    alt="Phone number Illustration"
                    className="max-w-2xl w-full object-contain"
                  />
                </div>
              </div>
            </Reveal>
          )}{" "}
          {step === 4 && (
            <div className="flex  flex-col items-center justify-center text-center py-10 gap-4">
              <Reveal>
                <div className=" w-full flex gap-4 justify-center items-center flex-col max-w-md sm:border border-blue-600/20 bg-white rounded-2xl sm:shadow-lg p-6 sm:p-8">
                  {/* Success Emoji */}
                  <div className="text-6xl">🎉</div>
                  {/* Message */}
                  <h2 className="text-xl xs:text-2xl font-bold text-green-600">
                    Congratulations !
                  </h2>
                  <p className="text-gray-500 text-sm max-w-sm">
                    You have successfully been verified and now a seller on{" "}
                    <span className="text-blue-600 font-semibold">
                      Nepogames{" "}
                    </span>
                    marketplace
                  </p>
                  {/* Buttons */}
                  <div className="items-center sm:text-sm flex text-xs gap-3 mt-4">
                    {/* VIEW DETAILS */}
                    <a onClick={() => router.push(`/marketplace`)}>
                      {" "}
                      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                        Marketplace
                      </button>
                    </a>

                    {/* LIST ANOTHER */}

                    <a onClick={() => router.push(`/sell-game`)}>
                      <button
                        onClick={() => {
                          setSuccess(false);
                          setSlug("");
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                      >
                        List your first game
                      </button>
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </Reveal>
    </PageLoader>
  );
}
