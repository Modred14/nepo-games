"use client";

import React from "react";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Reveal from "../../reveal";
import PageLoader from "@/components/PageLoader";
import { useParams, useRouter } from "next/navigation";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const params = useParams();
  const token = params?.slug;
  const router = useRouter();

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!password || !confirmPassword) {
        setError("All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setStep(2); // success screen
    } catch (err) {
      setError("Network error. Try again");
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
                    Set your new password
                  </p>

                  {/* EMAIL */}
                  <form action="">
                    <div className="relative mb-4">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder=" "
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="peer w-full border border-gray-300 rounded-md
                           pl-12 pr-12 py-4
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label
                        htmlFor="password"
                        className="
                  absolute left-12 bg-white px-1
                  text-gray-400 transition-all duration-200 ease-in-out
                  top-1/2 -translate-y-1/2
                  peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600
                  peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-sm
                "
                      >
                        Enter your Password
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <div className="relative mb-4">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmpassword"
                        disabled={loading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder=" "
                        className="peer w-full border border-gray-300 rounded-md
                           pl-12 pr-12 py-4
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <label
                        htmlFor="confirmpassword"
                        className="
                  absolute left-12 bg-white px-1
                  text-gray-400 transition-all duration-200 ease-in-out
                  top-1/2 -translate-y-1/2
                  peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600
                  peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-sm
                "
                      >
                        Confirm your Password
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
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
                      className="w-full shadow-md mt-5 hover:bg-blue-700 border border-blue-600 bg-[#0000FF] text-white font-semibold py-3 rounded-xl transition-all duration-700 mb-30 lg:mb-0 disabled:opacity-60"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                  {/* GOOGLE */}
                </div>
              </div>

              <div className="hidden border-l-2 border-[#6060FF] lg:flex lg:w-1/2 items-center justify-center bg-white">
                <img
                  src="/forgot-1.jpg"
                  alt="Login Illustration"
                  className="max-w-2xl w-full object-contain"
                />
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <div className="lg:h-screen flex  flex-col lg:flex-row  bg-white">
                {/* IMAGE SECTION */}

                <div className="w-full lg:hidden lg:w-1/2 flex justify-center items-center bg-white">
                  <img
                    src="/forgot-2.jpg"
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
                  <div className="w-full max-w-md mb-30 lg:mb-0 mx-auto bg-white rounded-3xl border border-gray-900/20 shadow-lg p-8 flex flex-col items-center text-center">
                    {/* ICON WRAPPER */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                      <img
                        className="relative h-24 w-24 object-contain"
                        src="/verification.png"
                        alt="Success Verification"
                      />
                    </div>

                    {/* TITLE */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Password Reset Successful 🎉
                    </h2>

                    {/* SUBTEXT */}
                    <p className="text-gray-500 text-sm mb-8">
                      Your password has been updated successfully. You can now
                      log in with your new credentials.
                    </p>

                    {/* BUTTON */}
                    <a onClick={() => router.push(`/login`)} className="w-full">
                      <button
                        type="button"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-lg font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
                      >
                        Continue to Login →
                      </button>
                    </a>
                  </div>
                </div>

                <div className="hidden border-l-2 border-[#6060FF] lg:flex lg:w-1/2 items-center justify-center bg-white">
                  <img
                    src="/forgot-2.jpg"
                    alt="Login Illustration"
                    className="max-w-2xl w-full object-contain"
                  />
                </div>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </PageLoader>
  );
}
