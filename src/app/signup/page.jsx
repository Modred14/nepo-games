"use client";

import React from "react";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);

  const user = {
    name: fullName,
    username: userName,
    email: email,
    password: password,
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    console.log(user);
  };

  return (
    <div className="lg:h-screen flex  flex-col lg:flex-row bg-white">
      <div className="w-full lg:hidden lg:w-1/2 flex justify-center items-center bg-white">
        <img
          src="/signup.jpg"
          alt="Login Illustration"
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
      <div className="w-full lg:w-1/2  h-full form-scroll lg:overflow-y-auto flex justify-center px-6 py-12 lg:py-25">
        {" "}
        <div className="w-full max-w-md">
          <div className="border border-blue-500 rounded-xl p-4 flex items-center gap-4 mb-8">
            <img
              src="/login.jpg"
              alt="Nepo Games"
              className="w-14 h-14 object-cover"
            />
            <div>
              <h2 className="font-semibold text-sm">
                <span className="text-blue-600 font-bold">NEPO</span> GAMES
              </h2>
              <p className="text-sm text-gray-600">
                Sign up to{" "}
                <span className="text-blue-600 font-bold">NEPO GAMES</span> and
                trade your games securely.
              </p>
            </div>
          </div>

          {/* HEADER */}
          <h1 className="text-3xl font-bold text-center mb-2">Welcome 👋</h1>

          <p className="text-center text-blue-600 mb-8">
            Create an account to continue
          </p>

          {/* EMAIL */}
          <form action="">
            <div className="relative mb-6">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <input
                type="text"
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md
               pl-12 pr-4 py-4
               focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label
                htmlFor="name"
                className="
      absolute left-12 bg-white px-1
      text-gray-400 transition-all duration-200 ease-in-out
      top-1/2 -translate-y-1/2
      peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600
      peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-sm
    "
              >
                Full Name
              </label>
            </div>
            <div className="relative mb-6">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <input
                type="text"
                id="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md
               pl-12 pr-4 py-4
               focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label
                htmlFor="username"
                className="
      absolute left-12 bg-white px-1
      text-gray-400 transition-all duration-200 ease-in-out
      top-1/2 -translate-y-1/2
      peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-600
      peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-sm
    "
              >
                User Name
              </label>
            </div>
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
            <div className="relative mb-4">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder=" "
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-sm text-center mb-7 pt-3">
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  name="checkbox"
                  id="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <div>
                  <span className="text-gray-600">I have to the </span>
                  <a
                    href="#"
                    agreed
                    className=" relative inline-block

    after:content-['']
    after:absolute
    after:left-0
    after:bottom-0
    after:h-[2px]
    after:w-full
    after:bg-current

    after:origin-right
    after:scale-x-0

    after:transition-transform
    after:duration-500
    after:ease-in-out
    font-bold

    hover:after:origin-left
    hover:after:scale-x-100 text-blue-600 font-medium"
                  >
                    Terms of Service
                  </a>
                  <span className="text-gray-600"> and </span>{" "}
                  <a
                    href="#"
                    className=" relative inline-block

    after:content-['']
    after:absolute
    after:left-0
    after:bottom-0
    after:h-[2px]
    after:w-full
    after:bg-current

    after:origin-right
    after:scale-x-0

    after:transition-transform
    after:duration-500
    after:ease-in-out
    font-bold

    hover:after:origin-left
    hover:after:scale-x-100 text-blue-600 font-medium"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
            {/* SIGN IN BUTTON */}
            <button
              onClick={handleSignUp}
              className="w-full shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF]  text-white font-semibold py-3 rounded-xl transition-all duration-700 mb-6"
            >
              Create Account
            </button>
          </form>
          {/* GOOGLE */}
          <div className="text-center text-sm text-gray-600 mb-3">
            Continue with
          </div>

          <div className="flex justify-center mb-6">
            <button className="flex items-center gap-3 border px-6 py-2 rounded-xl shadow-sm hover:bg-gray-100 duration-700 transition">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Google
            </button>
          </div>

          {/* CREATE ACCOUNT */}
          <div className="text-center text-sm">
            <span className="text-gray-600  pb-20">
              Already have an account?{" "}
            </span>
            <a
              href="/login"
              className="relative inline-block

    after:content-['']
    after:absolute
    after:left-0
    after:bottom-0
    after:h-[2px]
    after:w-full
    after:bg-current

    after:origin-right
    after:scale-x-0

    after:transition-transform
    after:duration-500
    after:ease-in-out
    font-bold

    hover:after:origin-left
    hover:after:scale-x-100 text-blue-600 font-medium"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>

      <div className="hidden md:flex lg:w-1/2 items-center justify-center bg-white">
        <img
          src="/signup.jpg"
          alt="Sign Up Illustration"
          className="max-w-2xl w-full object-contain"
        />
      </div>
    </div>
  );
}
