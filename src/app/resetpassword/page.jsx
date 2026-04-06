"use client";

import React from "react";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, NotepadText, Send } from "lucide-react";
import Reveal from "../reveal";
import PageLoader from "@/components/PageLoader";
import EmailAnimation from "@/components/Email";

export default function Login() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setStep(2);
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend email");
        return;
      }

      setMessage("Reset link sent again ✅");

      // start cooldown (30s)
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLoader>
      <div>
        {step === 1 ? (
          <Reveal>
            <div className="lg:h-screen flex  flex-col lg:flex-row  bg-white">
              {/* IMAGE SECTION */}
              <div className="w-full lg:hidden lg:w-1/2 flex justify-center items-center bg-white">
                <img
                  src="/forgot-1.jpg"
                  alt="forgot Illustration"
                  className="w-64 md:w-80 lg:max-w-2xl object-contain mt-10 lg:mt-0"
                />
              </div>

              <div className="w-full lg:hidden overflow-hidden">
                <svg
                  viewBox="0 0 1440 120"
                  className="w-full h-12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,60 C300,120 600,0 900,60 C1200,120 1440,40 1440,40"
                    stroke="#1D4ED8"
                    strokeWidth="3"
                    fill="transparent"
                  />
                </svg>
              </div>
              <div className="w-full lg:w-1/2 items-center h-full form-scroll lg:overflow-y-auto flex justify-center px-6 py-12 lg:py-25">
                {" "}
                <div className="w-full max-w-md  h-fit mx-auto mb-30 lg:mb-0 bg-white border border-gray-200 shadow-lg rounded-2xl p-6 sm:p-8">
                  {/* HEADER */}
                  <h1 className="text-[26px] font-bold text-center mb-1">
                    Retrieve Password{" "}
                  </h1>

                  <p className="text-sm text-blue-700 text-center mb-6">
                    Enter your email to receive a reset link
                  </p>

                  {/* EMAIL */}
                  <form action="">
                    <div className="relative mb-4">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                      <input
                        type="email"
                        id="email"
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                        className="peer w-full border border-gray-300 rounded-md
               pl-12 pr-4 py-4
               focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label
                        htmlFor="email"
                        className="
      absolute left-12 bg-white px-1
      text-gray-400 transition-all duration-200 ease-in-out
      top-1/2 -translate-y-1/2
      peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600
      peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-sm
    "
                      >
                        Enter your Email
                      </label>
                    </div>
                    {/* PASSWORD */}
                    {error && (
                      <p className="text-red-500 text-sm mt-3 text-center">
                        {error}
                      </p>
                    )}
                    {/* SIGN IN BUTTON */}
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="w-full py-3 mt-5 rounded-xl font-semibold text-white
    bg-blue-600 hover:bg-blue-700 active:scale-[0.99]
    transition-all duration-200 shadow-md
    disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending..." : "Send Email"}
                    </button>
                  </form>
                  {/* GOOGLE */}
                </div>
              </div>

              <div className="hidden border-l-2 border-[#6060FF] lg:flex lg:w-1/2 items-center justify-center bg-white">
                <img
                  src="forgot-1.jpg"
                  alt="Login Illustration"
                  className="max-w-2xl w-full object-contain"
                />
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="lg:h-screen flex  flex-col lg:flex-row  bg-white">
              {/* IMAGE SECTION */}
              <div className="w-full lg:hidden lg:w-1/2 flex justify-center items-center bg-white">
                <img
                  src="/forgot-1.jpg"
                  alt="forgot Illustration"
                  className="w-64 md:w-80 lg:max-w-2xl object-contain mt-10 lg:mt-0"
                />
              </div>

              <div className="w-full lg:hidden overflow-hidden">
                <svg
                  viewBox="0 0 1440 120"
                  className="w-full h-12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,60 C300,120 600,0 900,60 C1200,120 1440,40 1440,40"
                    stroke="#1D4ED8"
                    strokeWidth="3"
                    fill="transparent"
                  />
                </svg>
              </div>
              <div className="w-full lg:w-1/2 h-full form-scroll lg:overflow-y-auto flex items-center justify-center px-6 py-12 lg:py-24">
                <div className="w-full max-w-md grid place-items-center h-fit mx-auto mb-30 lg:mb-0 bg-white border border-gray-200 shadow-lg rounded-2xl p-6 sm:p-8">
                  <h1 className="text-2xl font-bold mb-2">Check your Email</h1>
                  <p className="text-blue-600 text-sm leading-relaxed mb-2">
                    We’ve sent a password reset link to
                  </p>
                  <p className="text-black font-semibold text-base break-all mb-4">
                    {email}
                  </p>
                  <p className="text-gray-500 text-center text-sm leading-relaxed mb-6">
                    Please check your inbox and follow the instructions to reset
                    your password.
                  </p>

                  {/* ANIMATION */}
                  <div className="mb-6">
                    <EmailAnimation />
                  </div>

                  {/* CTA */}
                  <a
                    href="mailto:"
                    className="block w-full shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF] text-white font-semibold py-3 rounded-xl transition-all duration-300 text-center"
                  >
                    Open your email app
                  </a>
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className="mt-4 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {loading
                      ? "Resending..."
                      : cooldown > 0
                        ? `Resend email in ${cooldown}s`
                        : "Resend email"}
                  </button>
                  {/* EXTRA HELP */}
                  <p className="text-gray-400 text-xs mt-4">
                    Didn’t receive the email? Check your spam folder.
                  </p>
                </div>
              </div>

              <div className="hidden border-l-2 border-[#6060FF] lg:flex lg:w-1/2 items-center justify-center bg-white">
                <img
                  src="forgot-1.jpg"
                  alt="Login Illustration"
                  className="max-w-2xl w-full object-contain"
                />
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </PageLoader>
  );
}
