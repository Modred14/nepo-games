"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Star } from "lucide-react";

export default function Conversation({ buyerId, GameDetails }) {
  const [textMessage, setTextMessage] = useState("");
  const [messages, setMessages] = useState([]);
  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    if (!localPart || localPart.length < 3) {
      return email; // too short to safely mask
    }

    const start = localPart.slice(0, 2); // "em"
    const end = localPart.slice(-2); // "ur"

    return `${start}***${end}@${domain}`;
  }
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const handleResize = () => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "0px"; // reset first
    el.style.height = el.scrollHeight + "px"; // grow to fit
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // stop newline
      handleSend();
    }
  };
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const messager = [
    {
      id: 1712650000000,
      time: "2026-04-08T15:30:00.000Z",
      text: "Hello there 👋",
      sender: "me",
    },
    {
      id: 1712650001000,
      time: "2026-04-08T15:30:10.000Z",
      text: "Hey! How are you?",
      sender: "them",
    },
    {
      id: 1712650002000,
      time: "2026-04-08T15:30:25.000Z",
      text: "I'm good, working on my chat UI 🔥",
      sender: "me",
    },
    {
      id: 1712650003000,
      time: "2026-04-08T15:30:40.000Z",
      text: "Nice! That’s actually impressive",
      sender: "them",
    },
    {
      id: 1712650004000,
      time: "2026-04-08T15:31:00.000Z",
      text: "Thanks 😎 still improving it",
      sender: "me",
    },
    {
      id: 1712650005000,
      time: "2026-04-08T15:31:15.000Z",
      text: "What stack are you using?",
      sender: "them",
    },
    {
      id: 1712650006000,
      time: "2026-04-08T15:31:30.000Z",
      text: "Next.js + Tailwind",
      sender: "me",
    },
    {
      id: 1712650007000,
      time: "2026-04-08T15:31:45.000Z",
      text: "Clean combo 🔥",
      sender: "them",
    },
    {
      id: 1712650008000,
      time: "2026-04-08T15:32:00.000Z",
      text: "Yeah, makes styling super fast",
      sender: "me",
    },
    {
      id: 1712650009000,
      time: "2026-04-08T15:32:20.000Z",
      text: "Are you adding real-time chat?",
      sender: "them",
    },
    {
      id: 1712650010000,
      time: "2026-04-08T15:32:40.000Z",
      text: "Thinking about Firebase or sockets",
      sender: "me",
    },
    {
      id: 1712650011000,
      time: "2026-04-08T15:33:00.000Z",
      text: "Sockets would be cooler tbh",
      sender: "them",
    },
    {
      id: 1712650012000,
      time: "2026-04-08T15:33:20.000Z",
      text: "True but more setup 😅",
      sender: "me",
    },
    {
      id: 1712650013000,
      time: "2026-04-08T15:33:40.000Z",
      text: "Worth it for scalability",
      sender: "them",
    },
    {
      id: 1712650014000,
      time: "2026-04-08T15:34:00.000Z",
      text: "You're right",
      sender: "me",
    },
    {
      id: 1712650015000,
      time: "2026-04-08T15:34:15.000Z",
      text: "How's the UI looking now?",
      sender: "them",
    },
    {
      id: 1712650016000,
      time: "2026-04-08T15:34:30.000Z",
      text: "Much better, more responsive now",
      sender: "me",
    },
    {
      id: 1712650017000,
      time: "2026-04-08T15:34:50.000Z",
      text: "Good good 👌",
      sender: "them",
    },
    {
      id: 1712650018000,
      time: "2026-04-08T15:35:10.000Z",
      text: "Still need to add message bubbles",
      sender: "me",
    },
    {
      id: 1712650019000,
      time: "2026-04-08T15:35:30.000Z",
      text: "And timestamps?",
      sender: "them",
    },
    {
      id: 1712650020000,
      time: "2026-04-08T15:35:45.000Z",
      text: "Yeah and read receipts",
      sender: "me",
    },
    {
      id: 1712650021000,
      time: "2026-04-08T15:36:00.000Z",
      text: "Now you're building WhatsApp 😂",
      sender: "them",
    },
    {
      id: 1712650022000,
      time: "2026-04-08T15:36:20.000Z",
      text: "Exactly the goal 😎",
      sender: "me",
    },
    {
      id: 1712650023000,
      time: "2026-04-08T15:36:40.000Z",
      text: "I respect the ambition",
      sender: "them",
    },
    {
      id: 1712650024000,
      time: "2026-04-08T15:37:00.000Z",
      text: "Appreciate it 🙌",
      sender: "me",
    },
    {
      id: 1712650025000,
      time: "2026-04-08T15:37:20.000Z",
      text: "Let me know when it's done",
      sender: "them",
    },
    {
      id: 1712650026000,
      time: "2026-04-08T15:37:40.000Z",
      text: "For sure!",
      sender: "me",
    },
    {
      id: 1712650027000,
      time: "2026-04-08T15:38:00.000Z",
      text: "I'll test it for you",
      sender: "them",
    },
    {
      id: 1712650028000,
      time: "2026-04-08T15:38:20.000Z",
      text: "Deal 🤝",
      sender: "me",
    },
    {
      id: 1712650029000,
      time: "2026-04-08T15:38:40.000Z",
      text: "Keep going, you're close 🚀",
      sender: "them",
    },
  ];
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.time) - new Date(b.time),
  );
  useEffect(() => {
    setMessages(messager);
  }, []);
  const scrollBy = (amount) => {
    if (!containerRef.current) return;
    if (inputRef.current) return;
    containerRef.current.scrollBy({
      top: amount,
      behavior: "smooth",
    });
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current) return;
      if (inputRef.current) return;
      if (e.key === "ArrowDown") {
        scrollBy(100);
      }

      if (e.key === "ArrowUp") {
        scrollBy(-100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const handleSend = () => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "auto";
    if (!textMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      time: Date.now(),
      text: textMessage,
      sender: "me",
    };
    setMessages((prev) => [...prev, newMessage]);
    setTextMessage("");
  };
  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const lastIndex = messages.length - 1;
  return (
    <div className="h-dvh w-full overflow-hidden flex bg-cover bg-center">
      <div className="p-4 md:grid hidden">
        <div className="border border-blue-500/40 rounded-xl shadow-sm bg-white sm:min-w-60 lg:min-w-72 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-blue-50">
            <p className="font-semibold text-blue-700 text-center text-sm tracking-wide">
              SELLER INFORMATION
            </p>
          </div>

          {/* Seller Info */}
          <div className="flex px-4 py-4 items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="font-semibold text-[#0000FF]">"game.username"</p>
            </div>

            <img
              src="{game.profile_image}"
              className="w-11 h-11 rounded-full border-2 border-blue-500/60 object-cover"
              alt="seller"
            />
          </div>

          {/* Rating */}
          <div className="px-4 pb-4 border-b">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className="text-gray-300" />
              ))}
            </div>
            <p className="text-xs text-gray-500">No ratings yet</p>
          </div>

          {/* Performance */}
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-[#0000FF] mb-3">
              Seller Performance
            </p>

            <div className="flex justify-between items-center">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-[#0000FF]">Quality:</span>{" "}
                  <span className="font-medium text-green-600">Excellent</span>
                </p>
                <p>
                  <span className="text-[#0000FF]">Ratings:</span>{" "}
                  <span className="font-medium text-yellow-600">Good</span>
                </p>
                <p>
                  <span className="text-[#0000FF]">Response:</span>{" "}
                  <span className="font-medium text-green-600">Fast</span>
                </p>
              </div>

              <img
                src="/Vector (1).png"
                className="h-14 opacity-80"
                alt="performance"
              />
            </div>
          </div>
        </div>
      </div>{" "}
      <div className="relative z-10 h-screen  overflow-hidden flex flex-col w-full">
        <div className="relative z-10 h-screen flex flex-col w-full overflow-hidden">
          {/* background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/conversation.png')" }}
          />
          <div className="absolute inset-0 bg-white/80" />

          {/* CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col h-full">
            {/* HEADER (NO FIXED) */}
            <div className="p-4 shrink-0">
              <div className="w-full p-2 px-5 rounded-3xl bg-blue-500/15 border backdrop-blur-sm border-blue-700/50">
                <div className="flex gap-2 items-center">
                  <img
                    src="/profile.png"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      UserName
                    </p>
                    <p className="text-xs text-gray-800">
                      {maskEmail("favourdomirin@gmail.com")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MESSAGES (THIS IS THE KEY FIX) */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-6 pb-4  thin-scroll"
            >
              {sortedMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${index === lastIndex ? "mb-0" : "mb-1"} w-full ${
                    message.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm wrap-break-word  ${
                      message.sender === "me"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-blue-100 rounded-bl-sm"
                    }`}
                  >
                    {message.text}
                    <p
                      className={`text-[10px] mt-1 ${
                        message.sender === "me"
                          ? "text-blue-100 text-right"
                          : "text-gray-400 text-left"
                      }`}
                    >
                      {formatTime(message.time)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* INPUT (NO FIXED) */}
            <div className="p-4  shrink-0">
              <div
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-3  min-w-0
          bg-white/80 backdrop-blur-xl 
          border border-blue-700/50
          rounded-full px-4 py-2
          shadow-xs cursor-text"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0">
                  <img
                    src="/conversation.png"
                    className="w-full h-full object-cover"
                  />
                </div>

                <textarea
                  ref={inputRef}
                  type="text"
                  value={textMessage}
                  onChange={(e) => {
                    setTextMessage(e.target.value);
                    handleResize();
                  }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 max-h-30 thin-scroll resize-none bg-transparent outline-none text-gray-700 xs:text-base text-sm"
                />

                <button
                  onClick={handleSend}
                  className="inline-flex min-w-0 items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
