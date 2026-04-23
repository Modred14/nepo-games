"use client";

import { useSearchParams } from "next/navigation";
import React from "react";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Reveal from "../reveal";
import ErrorModal from "../../components/ErrorModal";
import SuccessModal from "../../components/SuccessModal";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTrigger, setErrorTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const msg = params.get("msg");
  const verified = params.get("verified");
  const signupSuccess = params.get("signupSuccess");
  const oauthError = params.get("oauthError");

  useEffect(() => {
    if ((verified || signupSuccess) && msg) {
      setMessage(msg);
      setSuccessOpen(true);
    }
  }, [msg, verified, signupSuccess]);

  useEffect(() => {
    if (oauthError && msg) {
      setMessage(msg);
      setErrorOpen(true);
    }
  }, [oauthError]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("nepo-user"));

    if (user) {
      router.push("/marketplace");
    }
  }, [router]);
  const handleGoogleSignIn = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setGoogleLoad(true);

      await signIn("google", {
        callbackUrl: "/marketplace",
      });
    } catch (err) {
      console.error("Google login failed:", err);
      setLoading(false);
      setGoogleLoad(false);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email?.trim()) {
      setMessage("Email address is required.");
      setErrorOpen(true);
      setErrorTrigger((prev) => prev + 1);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      setErrorOpen(true);
      setErrorTrigger((prev) => prev + 1);
      return;
    }

    if (!password) {
      setMessage("Password is required.");
      setErrorOpen(true);
      setErrorTrigger((prev) => prev + 1);
      return;
    }

    try {
      setLoading(true);

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);
      if (res?.error) {
        setSuccessOpen(false);
        console.log(res.error);
        if (res.error.includes("EMAIL_NOT_VERIFIED")) {
          setMessage(
            "Email not verified. Please verify your email address before logging in.",
          );
        } else if (res.error.includes("INVALID_CREDENTIALS")) {
          setMessage("Invalid email or password.");
        } else {
          setMessage("Network error. Please try again.");
        }
        setErrorOpen(true);
        console.log(res.error);
        setErrorTrigger((prev) => prev + 1);
        return;
      }

      if (res?.ok) {
        setErrorOpen(false);
        setMessage("Login successful!");
        setSuccessOpen(true);

        setTimeout(() => {
          router.push("/marketplace");
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      setMessage("Network error. Try again.");
      setErrorOpen(true);
      setErrorTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="lg:h-screen flex  flex-col lg:flex-row  bg-white">
      <div className="w-full lg:hidden lg:w-1/2 flex justify-center items-center bg-white">
        <img
          src="/login.jpg"
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
              src="/logo.png"
              alt="Nepo Games"
              className="w-14 h-14 p-2 rounded-xl bg-blue-700 object-cover"
            />
            <div>
              <h2 className="font-semibold text-sm">
                <span className="text-blue-600 font-bold">NEPO</span> GAMES
              </h2>
              <p className="text-sm text-gray-600">
                Sign in to{" "}
                <span className="text-blue-600 font-bold">NEPO GAMES</span> and
                trade your games securely.
              </p>
            </div>
          </div>

          {/* HEADER */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Welcome Back 👋
          </h1>

          <p className="text-center text-blue-600 mb-8">
            Sign in to your account to continue to Nepo Games
          </p>
          <ErrorModal
            isOpen={errorOpen}
            message={message}
            triggerId={errorTrigger}
            onClose={() => setErrorOpen(false)}
            autoClose
          />
          <SuccessModal
            isOpen={successOpen}
            message={message}
            triggerId={errorTrigger}
            onClose={() => setSuccessOpen(false)}
            autoClose
          />
          <form className="mt-2" onSubmit={handleLogin}>
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
            <div className="relative mb-4">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
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
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-sm text-center mb-7 pt-3">
              <span className="text-gray-600">
                Can't remember your password?{" "}
              </span>
              <a
                onClick={() => router.push(`/resetpassword`)}
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
                Forgot Password
              </a>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full shadow-md hover:bg-blue-700 border border-blue-600 bg-[#0000FF]  text-white font-semibold py-3 rounded-xl transition-all duration-700 mb-6"
            >
              {loading && !googleLoad ? (
                <div className="flex w-full text-center justify-center gap-3">
                  <span className="inline-block w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          {/* GOOGLE */}
          <div className="text-center text-sm text-gray-600 mb-3">
            Continue with
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center gap-3 border px-6 py-2 rounded-xl shadow-sm hover:bg-gray-100 duration-700 transition"
            >
              {loading && googleLoad ? (
                <div className="flex w-full text-center justify-center gap-3">
                  <span className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>{" "}
                </div>
              ) : (
                <>
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Google
                </>
              )}
            </button>
          </div>

          {/* CREATE ACCOUNT */}
          <div className="text-center text-sm   pb-20 ">
            <span className="text-gray-600">Don’t have an account yet? </span>
            <a
              onClick={() => router.push(`/signup`)}
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
              Create an account
            </a>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white">
        <img
          src="/login.jpg"
          alt="Login Illustration"
          className="max-w-2xl w-full object-contain"
        />
      </div>
    </div>
  );
}
