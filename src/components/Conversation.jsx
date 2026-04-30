"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronLeft, CreditCard, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import Loader from "./Loader";
import { Verified } from "lucide-react";

export default function Conversation({ gameId, receiverId }) {
  const [textMessage, setTextMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [view, setView] = useState("list");
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user/me");

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setUser(data);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    let interval;

    const load = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        if (String(receiverId) === "1") {
          const res = await fetch(`/api/system-messages?user_id=${user.id}`);
          const data = await res.json();
          setAdminMessages(Array.isArray(data) ? data : []);
          setChatMessages([]);
          setConversation(null);
          return;
        }

        // 👇 NORMAL CHAT MODE
        const res = await fetch(
          `/api/c/${gameId}/messages?receiver_id=${receiverId}`,
        );

        const data = await res.json();

        setChatMessages(Array.isArray(data.messages) ? data.messages : []);
        setAdminMessages([]);
        setConversation(data.conversation || null);
      } catch (err) {
        console.error("Polling failed:", err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };
    load(true);
    interval = setInterval(() => load(false), 1000);

    return () => clearInterval(interval);
  }, [gameId, receiverId]);
  const hasScrolledRef = useRef(false);
  const isAdmin = String(receiverId) === "1";
  const initialMessages = messages;
  const chatId = conversation?.id;
  const userId = user?.id;
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [gameId, receiverId]);
  const groupConversations = (conversations, userId) => {
    const map = new Map();

    for (const convo of conversations) {
      const key = convo.listing_id;

      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...convo });
        continue;
      }

      const isNewer =
        new Date(convo.lastmessagetime) > new Date(existing.lastmessagetime);

      if (isNewer) {
        existing.lastmessage = convo.lastmessage;
        existing.lastmessagetime = convo.lastmessagetime;
      }

      if (convo.receiver_id !== userId) {
        existing.username = convo.username;
        existing.profile_image = convo.profile_image;
        existing.receiver_id = convo.receiver_id;
      }

      map.set(key, existing);
    }

    return Array.from(map.values());
  };
  const NEPO_CHAT = {
    id: "nepo-system",
    listing_id: "nepo-system",
    gamedetails: "NepoGames",
    username: "Nepo Games",
    email: "nepogames.com@gmail.com",
    profile_image: "/conversation.png",
    receiver_id: 1,
    lastmessage: "This is an announcement channel",
    lastmessagetime: new Date().toISOString(),
    unreadcount: 0,
  };

  useEffect(() => {
    let interval;

    const fetchAndSet = async () => {
      try {
        const res = await fetch(`/api/conversations`);

        const data = await res.json();

        const grouped = groupConversations(data);

        setConversations([NEPO_CHAT, ...grouped]);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchAndSet();
    interval = setInterval(fetchAndSet, 1000);

    return () => clearInterval(interval);
  }, []);
  const isComposingRef = useRef(false);
  const lastInputTypeRef = useRef("");

  const params = useParams();
  const currentChatId = params.slug;

  const router = useRouter();
  const pathname = usePathname();
  function maskEmail(email) {
    const isMobile = window.innerWidth < 400;

    if (isMobile) {
      const [localPart, domain] = email.split(".");
      if (!localPart || localPart.length < 3) {
        return email;
      }
      const start = localPart.slice(0, 2);
      const end = localPart.slice(-1);
      return `${start}***${end}.${domain}`;
    }

    const [localPart, domain] = email.split("@");

    if (!localPart || localPart.length < 3) return email;

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

  const allMessages = useMemo(() => {
    const source = String(receiverId) === "1" ? adminMessages : chatMessages;
    const merged = [...(source || []), ...messages].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
    if (isAdmin) {
      return merged;
    }
    const result = [];

    let i = 0;

    while (i < merged.length) {
      const current = merged[i];
      let count = 1;
      while (
        i + count < merged.length &&
        merged[i + count].message === current.message &&
        merged[i + count].sender_id === current.sender_id
      ) {
        count++;
      }
      const toShow = Math.ceil(count / 2);
      for (let j = 0; j < toShow; j++) {
        result.push(current);
      }
      i += count;
    }

    return result;
  }, [adminMessages, chatMessages, receiverId, messages]);

  useEffect(() => {
    if (isMobile) {
      if (currentChatId && Number(currentChatId) !== 1) {
        setView("chat");
      } else {
        setView("list");
      }
    } else {
      setView("chat");
    }
  }, [isMobile, currentChatId]);

  const markAsRead = async () => {
    try {
      await fetch(`/api/c/${gameId}/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
        }),
      });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  useEffect(() => {
    if (!bottomRef.current) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [allMessages.length]);
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
      created_at: new Date().toISOString(),
      chatId,
      gameId,
      message: textMessage,
      sender_id: userId,
    };
    setMessages((prev) => [...prev, newMessage]);
    setTextMessage("");
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
    try {
      await fetch(`/api/c/${gameId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: newMessage.message,
          gameId,
          receiverId,
        }),
      });
      await markAsRead();
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  const formatTime = (time) => {
    if (!time) return;
    return new Date(time).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (hasScrolledRef.current) return;
    const timeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timeout);
  }, [allMessages.length]);

  const lastIndex = allMessages.length - 1;
  const isSystemChat = String(gameId) === "1" && String(receiverId) === "1";
  const activeChat = isSystemChat
    ? NEPO_CHAT
    : conversations.find(
        (chat) => String(chat.listing_id) === String(currentChatId),
      );
  if (loadingChats) {
    return <Loader />;
  }

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-cover bg-center">
      {(!isMobile || view === "list") && (
        <div className="sm:grid w-full h-full sm:w-70 lg:w-90 ">
          <div className="border border-blue-500/30 shadow-md bg-white w-full sm:w-70 lg:w-90  overflow-hidden flex flex-col h-full">
            {/* HEADER */}
            <div className="relative px-4 py-3 flex items-center border-b border-gray-500/15 bg-blue-50/60 backdrop-blur-sm">
              <button
                onClick={() => router.push("/marketplace")}
                className="absolute left-2 font-bold rounded-full active:scale-90 transition-transform duration-150"
              >
                <ChevronLeft size={24} className="text-blue-700" />
              </button>

              <p className="w-full text-center font-semibold text-blue-700 uppercase">
                Chats
              </p>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto thin-scroll">
              {conversations.map((chat) => {
                const isActive = isSystemChat
                  ? chat.receiver_id === 1 && chat.listing_id === "nepo-system"
                  : currentChatId &&
                    chat?.id &&
                    String(currentChatId) === String(chat.listing_id);

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      router.push(
                        `/c/${chat.listing_id}?receiver_id=${chat.receiver_id}`,
                      );
                      if (isMobile) {
                        setLoadingChats(true);
                        setView("chat");
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100
              transition-all duration-150
              ${isActive && !isMobile ? "bg-blue-100/60 border-l-4 border-blue-600" : "hover:bg-blue-50/50"}
            `}
                  >
                    {/* AVATAR */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={chat.profile_image || "/profile.png"}
                        className="w-12 h-12 border rounded-full border-blue-600/50 object-cover"
                      />
                      {chat?.plan && chat.plan !== "free" && (
                        <Verified
                          className="fill-green-600 fixed -mt-3 ml-7 text-green-100"
                          size={16}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.gamedetails}
                        </p>

                        <p className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {formatTime(chat.lastmessagetime)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate pr-2">
                          {chat.lastmessage || "Start a conversation..."}
                        </p>

                        {chat.unreadcount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                            {chat.unreadcount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {(view === "chat" || !isMobile) && (
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
                <div className="w-full p-2 px-5 rounded-3xl flex justify-between bg-white/80 backdrop-blur-xl border backdrop-blur-sm border-blue-700/50">
                  <div className="flex gap-2 items-center">
                    {isMobile && (
                      <button
                        onClick={() => {
                          setView("list");
                        }}
                        className="-ml-4 font-bold rounded-full active:scale-90 transition-transform duration-150"
                      >
                        <ChevronLeft size={24} className="text-blue-700" />
                      </button>
                    )}
                    <img
                      src={
                        isAdmin
                          ? "/conversation.png"
                          : activeChat?.profile_image || "/profile.png"
                      }
                      className="h-10 -ml-1 xs:ml-0 w-10 rounded-full border border-blue-600/80 object-cover"
                    />
                    {activeChat?.plan && activeChat.plan !== "free" && (
                      <Verified
                        className="fill-green-600 fixed mt-7 ml-7 text-green-100"
                        size={16}
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        {isAdmin
                          ? "NepoGames"
                          : activeChat?.username || "Unknown User"}
                      </p>

                      <p className="text-xs text-gray-800">
                        {isAdmin
                          ? "nepogames.com@gmail.com"
                          : maskEmail(activeChat?.email || "user@email.com")}
                      </p>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="h-10  flex items-center">
                      <button
                        // onClick={}
                        className="inline-flex sm:h-8 h-7 p-2 gap-1 sm:gap-2 min-w-0 rounded-md text-xs sm:text-sm items-center justify-center bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CreditCard size={15} />{" "}
                        <p className="inline-flex ">Pay Now</p>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-6 pb-4  thin-scroll"
              >
                {allMessages.length == 0 && !loading && !isAdmin && (
                  <div className="h-full flex items-center justify-center ">
                    <div className="bg-white/40 backdrop-blur-sm shadow-2xs px-4 py-5 rounded-xl border border-white/20">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.8-3.6A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            No Messages Yet
                          </h2>
                          <p className="text-gray-500 text-sm mt-1">
                            Start a conversation and trade instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div className="mb-4">
                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-gray-800 space-y-2">
                      <p className="font-bold text-base text-yellow-700">
                        Welcome to Nepo Games Chat 👋
                      </p>

                      <p>
                        This is a secure space for buyers and sellers to discuss
                        game listings and transactions.
                      </p>

                      <p className="font-semibold">Rules:</p>

                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <strong>Do not share sensitive information</strong>{" "}
                          (passwords, personal details, etc.)
                        </li>
                        <li>
                          <strong>
                            Do not move conversations outside Nepo Games
                          </strong>{" "}
                          (WhatsApp, Telegram, etc.)
                        </li>
                        <li>
                          <strong>
                            Do not send or request account numbers
                          </strong>
                        </li>
                        <li>
                          <strong>Use only Nepo Games payment method</strong>{" "}
                          for all transactions
                        </li>
                        <li>
                          <strong>
                            Do not release account login details until payment
                            has been confirmed
                          </strong>
                        </li>
                      </ul>

                      <p className="text-red-600 font-semibold pt-2">
                        Failure to comply will result in immediate account
                        suspension.
                      </p>
                    </div>
                  </div>
                )}
                {loading && !isAdmin ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col shadow-2xs items-center space-y-2 bg-white/40 backdrop-blur-sm px-4 py-5 pt-6 rounded-xl border border-white/20">
                      {/* Chat-style loader */}
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                      </div>

                      {/* Text */}
                      <p className="text-gray-800 text-sm font-bold">
                        Loading chat
                        <span className="ml-1 loading-dots"></span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {allMessages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${index === lastIndex ? "mb-0" : "mb-1"} w-full ${
                          !isAdmin && userId === message.sender_id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap text-sm shadow-sm wrap-break-word  ${
                            !isAdmin && userId === message.sender_id
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-blue-100 rounded-bl-sm"
                          }`}
                        >
                          {message.title && (
                            <div>
                              <p className="font-bold text-base">
                                {" "}
                                {message.title}
                              </p>
                            </div>
                          )}
                          {message.message}
                          <p
                            className={`text-[10px] mt-1 ${
                              !isAdmin && userId === message.sender_id
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
                    disabled={loading || isAdmin}
                    placeholder={
                      isAdmin
                        ? "This is an announcement channel"
                        : "Type a message..."
                    }
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
                    className="flex-1 min-w-0 max-h-30 thin-scroll resize-none bg-transparent outline-none text-gray-700 xs:text-base text-sm"
                  />
                  {!isAdmin && (
                    <button
                      onClick={handleSend}
                      className="inline-flex min-w-0 items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
