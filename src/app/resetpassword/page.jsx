"use client";

import React from "react";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");


  const handleReset = (e) => {
    e.preventDefault();
   
  };

  return (
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
            Enter the email associated with your account and we will send a
            password reset email.
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
            
            {/* SIGN IN BUTTON */}
            <button
              onClick={handleReset}
              className="w-full mt-5 shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF]  text-white font-semibold py-3 rounded-xl transition-all duration-700 mb-6"
            >
              Send Email
            </button>
          </form>
          {/* GOOGLE */}
        
      </div></div>

      <div className="hidden border-l-2 border-[#6060FF] md:flex lg:w-1/2 items-center justify-center bg-white">
        <img
          src="forgot-1.jpg"
          alt="Login Illustration"
          className="max-w-2xl w-full object-contain"
        />
      </div>
    </div>
  );
}
