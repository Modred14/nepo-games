"use client";

import React from "react";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, NotepadText, Send } from "lucide-react";
import Reveal from "../reveal";
import PageLoader from "@/components/PageLoader";
import EmailAnimation from "@/components/Email";

export default function Login() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
                <div className="w-full max-w-md">
                  {/* HEADER */}
                  <h1 className="text-3xl font-bold text-center mb-2">
                    Retrieve Password{" "}
                  </h1>

                  <p className="text-center text-blue-600 mb-8">
                    Enter the email associated with your account and we will
                    send a password reset email.
                  </p>

                  {/* EMAIL */}
                  <form action="">
                    <div className="relative mb-6">
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
                      className="w-full mt-5 mb-30 lg:mb-0 shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF] text-white font-semibold py-3 rounded-xl transition-all duration-700 disabled:opacity-60"
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
              <div className="w-full lg:w-1/2 items-center h-full form-scroll lg:overflow-y-auto flex justify-center px-6 py-12 lg:py-25">
                {" "}
                <div className="w-full max-w-md">
                  {/* HEADER */}
                  <h1 className="text-3xl font-bold text-center mb-2">
                    Check your Email
                  </h1>

                  <p className="text-center text-blue-600 mb-4">
                    We have sent a password reset link to your Email address:
                    <span className="text-black font-bold"> {email}</span>.
                    Please check your inbox and follow the instruction to reset
                    your password
                  </p>
                  <EmailAnimation />

                  <a
                    href="mailto:someone@example.com"
                    className="block w-full mt-5 mb-30 lg:mb-0 shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF] text-white font-semibold py-3 rounded-xl transition-all duration-700 text-center"
                  >
                    Open Gmail app
                  </a>
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
