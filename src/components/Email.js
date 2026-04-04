"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NotepadText, Send, Mail } from "lucide-react";

const steps = [NotepadText, Send, Mail];

export default function EmailAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setTimeout(() => setStep(1), 800);
    setTimeout(() => setStep(2), 1600);
  }, []);

  const Icon = steps[step];

  return (
    <div className="flex justify-center items-center text-blue-700">
      <motion.div
        layout
        transition={{
          layout: { duration: 0.4, type: "spring", stiffness: 150 },
        }}
        animate={{
          scale: [1, 0.85, 1],
          rotate: step === 1 ? 20 : step === 2 ? -10 : 0,
        }}
      >
        <Icon size={60} />
      </motion.div>
    </div>
  );
}