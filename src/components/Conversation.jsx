"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import Loader from "./Loader";

export default function Conversation({ gameId, receiverId }) {
  const [textMessage, setTextMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [serverMessages, setServerMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;

    const load = async (isInitial = false) => {
      try {
        const storedUser = localStorage.getItem("nepo-user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (!gameId || !user?.id) return;
        setUser(user);
        if (isInitial) setLoading(true);
        const res = await fetch(
          `/api/c/${gameId}/messages?user_id=${user.id}&receiver_id=${receiverId}`,
        );
        const data = await res.json();

        setServerMessages(data.messages);
        setConversation(data.conversation);
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

  const initialMessages = messages;
  const chatId = conversation?.id;
  const userId = user?.id;
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

  useEffect(() => {
    let interval;

    const fetchAndSet = async () => {
      const storedUser = localStorage.getItem("nepo-user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/conversations?user_id=${user.id}`);

        const data = await res.json();

        const grouped = groupConversations(data, user.id);

        setConversations(grouped);
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
    const merged = [...serverMessages, ...messages].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );

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
  }, [serverMessages, messages]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    return () => clearTimeout(timeout);
  }, [allMessages.length]);
  useEffect(() => {
    if (!gameId || !userId || !conversation?.id) return;
    if (!serverMessages) return;

    const timeout = setTimeout(() => {
      const markAsRead = async () => {
        try {
          await fetch(`/api/c/${gameId}/mark-read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              gameId,
            }),
          });
        } catch (err) {
          console.error("Failed to mark as read", err);
        }
      };

      markAsRead();
    }, 500);

    return () => clearTimeout(timeout);
  }, [gameId, userId, conversation?.id, serverMessages]);
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
    if (!time) return;
    return new Date(time).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeChat = conversations.find(
    (chat) => String(chat.listing_id) === String(currentChatId),
  );
  const lastIndex = allMessages.length - 1;

  if (loadingChats) {
    return <Loader />;
  }

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-cover bg-center">
      <div className="md:grid hidden h-full">
        <div className="border border-blue-500/30 shadow-md bg-white sm:w-70 lg:w-90 overflow-hidden flex flex-col h-full">
          {/* HEADER */}
          <div className="px-4 py-3 border-b border-gray-500/40 bg-blue-50/60 backdrop-blur-sm">
            <p className="font-semibold text-blue-700 text-center text-xs tracking-[0.2em] uppercase">
              Chats
            </p>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto thin-scroll">
            {conversations.map((chat) => {
              const isActive =
                currentChatId &&
                chat?.id &&
                String(currentChatId) === String(chat.listing_id);

              return (
                <div
                  key={chat.id}
                  onClick={() =>
                    router.push(
                      `/c/${chat.listing_id}?user_id=${userId}&receiver_id=${chat.receiver_id}`,
                    )
                  }
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100
              transition-all duration-150
              ${isActive ? "bg-blue-100/60 border-l-4 border-blue-600" : "hover:bg-blue-50/50"}
            `}
                >
                  {/* AVATAR */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={chat.profile_image || "/profile.png"}
                      className="w-12 h-12 border rounded-full border-blue-600/50 object-cover"
                    />
                    {/* 
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )} */}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    {/* top row */}
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.gamedetails}
                      </p>

                      <p className="text-[10px] text-gray-400  shrink-0 ml-2">
                        {formatTime(chat.lastmessagetime)}
                      </p>
                    </div>

                    {/* bottom row */}
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
              <div className="w-full p-2 px-5 rounded-3xl  bg-white/80 backdrop-blur-xl border backdrop-blur-sm border-blue-700/50">
                <div className="flex gap-2 items-center">
                  <img
                    src={activeChat?.profile_image || "/profile.png"}
                    className="h-10 w-10 rounded-full border border-blue-600/80 object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      {activeChat?.username || "Unknown User"}
                    </p>

                    <p className="text-xs text-gray-800">
                      {maskEmail(activeChat?.email || "user@email.com")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                  {allMessages.map((message, index) => (
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
