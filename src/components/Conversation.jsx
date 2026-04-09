"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Send, Star } from "lucide-react";
import { div } from "framer-motion/m";
import SmallLoader from "./smallLoader";

export default function Conversation({
  chatId,
  gameId,
  receiverId,
  initialMessages,
  userId,
  loading,
}) {
  const [textMessage, setTextMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const isComposingRef = useRef(false);
  const lastInputTypeRef = useRef("");

  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    if (!localPart || localPart.length < 3) {
      return email;
    }

    const start = localPart.slice(0, 2);
    const end = localPart.slice(-2);

    return `${start}***${end}@${domain}`;
  }
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const handleResize = () => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  };
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };
  const handleBeforeInput = (e) => {
    lastInputTypeRef.current = "beforeinput";

    // Mobile keyboards often behave better here
    if (e.inputType === "insertLineBreak") {
      e.preventDefault();
      handleSend();
    }
  };
  const handleKeyButDown = (e) => {
    lastInputTypeRef.current = "keydown";
    if (e.isComposing || isComposingRef.current) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [messages]);
  useEffect(() => {
    if (initialMessages?.length) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
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
  const handleSend = async () => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "auto";
    if (!textMessage.trim()) return;

    const newMessage = {
      id: crypto.randomUUID(),
      created_at: Date.now(),
      chatId,
      gameId,
      message: textMessage,
      sender_id: userId,
    };
    setMessages((prev) => [...prev, newMessage]);
    setTextMessage("");
    try {
      await fetch(`/api/c/${gameId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          text: newMessage.message,
          gameId,
          receiverId,
        }),
      });
    } catch (err) {
      console.error("Send failed", err);
    }
  };
  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const lastIndex = sortedMessages.length - 1;
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
      <div className="relative z-10 overflow-hidden flex flex-col w-full">
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
              {loading ? (
                <div className="h-full justify-center flex items-center">
                  <p className="text-black font-semibold">
                    Loading Chat<span className="loading-dots"></span>
                  </p>
                </div>
              ) : (
                <div>
                  {sortedMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${index === lastIndex ? "mb-0" : "mb-1"} w-full ${
                        userId === message.sender_id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm wrap-break-word  ${
                          userId === message.sender_id
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-blue-100 rounded-bl-sm"
                        }`}
                      >
                        {message.message}
                        <p
                          className={`text-[10px] mt-1 ${
                            userId === message.sender_id
                              ? "text-blue-100 text-right"
                              : "text-gray-400 text-left"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                  onKeyDown={handleKeyButDown}
                  onBeforeInput={handleBeforeInput}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
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
