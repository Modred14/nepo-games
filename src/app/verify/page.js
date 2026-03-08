"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (token) {
      fetch(`/api/verify?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.redirect) {
            console.log("redirect")
            window.location.href = data.redirect;
            return; 
          }

          if (data.error) {
            setMessage(data.error);
          } else {
            setMessage("Verification successful! Redirecting...");
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }
        })
        .catch((err) => {
          setMessage("Something went wrong");
          console.log(err);
        });
    }
  }, [token]);

  return <p>{message}</p>;
}
