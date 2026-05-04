"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronLeft, CreditCard, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import Loader from "./Loader";
import { Verified } from "lucide-react";
import { useSearchParams } from "next/navigation";
import LoginDropBox from "./LoginDropBox";

export default function Conversation({ gameId, receiverId }) {
  const [textMessage, setTextMessage] = useState("");
  const [load, setLoad] = useState(true);
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
  const [roleData, setRoleData] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [sellerLoad, setSellerLoad] = useState(true);
  const [loginModal, setLoginModal] = useState(false);
  const [loginData, setLoginData] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [buyModal, setBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [buy, setBuy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [payError, setPayError] = useState("");
  const [loginDetails, setLoginDetails] = useState(false);
  const [loadDet, setLoadDet] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [disputeError, setDisputeError] = useState("");
  const [disputeLoad, setDisputeLoad] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");

    if (payment === "success") {
      setSuccessModal(true);
    }
  }, [searchParams]);

  // useEffect(() => {
  //   if (!gameId || isSeller) return;

  //   const fetchLogin = async () => {
  //     try {
  //       const res = await fetch(`/api/c/${gameId}/login-details`);
  //       const data = await res.json();

  //       if (data.hasLogin) {
  //         setLoginData(data.login);
  //         setLoginModal(true);
  //       }
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   fetchLogin();
  //   const interval = setInterval(fetchLogin, 5000);

  //   return () => clearInterval(interval);
  // }, [gameId]);
  const handleShowDetails = async () => {
    const current = loginData?.[0];
    if (!current) return;

    setLoadDet(true);

    try {
      if (!current.expires_at) {
        const res = await fetch(`/api/expire-check?conversationId=${chatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveryId: current.id }),
        });

        const data = await res.json();

        setLoginData((prev) =>
          prev.map((item) =>
            item.id === current.id ? { ...item, ...data.data } : item,
          ),
        );
      }

      // ALWAYS show details regardless
      setShowDetails(true);
    } catch (err) {
      console.error("Failed to initialize expiry:", err);
    } finally {
      setLoadDet(false);
    }
  };
  useEffect(() => {
    if (!showDetails || loginData.length === 0) return;

    let interval = "";
    const current = loginData[0];
    if (!current.expires_at) return;

    const expiry = new Date(current.expires_at).getTime();

    const updateTimer = () => {
      const diff = expiry - Date.now();

      if (diff <= 0) {
        setTimeLeft("Elapsed");
        clearInterval(interval);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [loginData, showDetails]);
  useEffect(() => {
    if (!gameId) return;

    const loadRole = async () => {
      try {
        const res = await fetch(`/api/c/${gameId}/role`);
        const data = await res.json();
        setRoleData(data);
      } catch (err) {
        console.error("Role fetch failed", err);
      } finally {
        setSellerLoad(false);
      }
    };

    loadRole();
  }, [gameId]);
  const isSeller = roleData?.role === "seller";

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
    id: "1",
    listing_id: "1",
    gamedetails: "NepoGames",
    username: "Nepo Games",
    email: "nepogames.com@gmail.com",
    profile_image: "/conversation.png",
    receiver_id: 1,
    lastmessage: "This is an announcement channel",
    lastmessagetime: new Date().toISOString(),
    unreadcount: 0,
  };
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
  useEffect(() => {
    let interval;

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

  const fetchLoginDetails = async () => {
    try {
      const res = await fetch(`/api/login-delivery?conversationId=${chatId}`);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch login details");
      }
      setLoginData(data.data || []);
      if (data.data && data.data.length > 0) {
        setLoginDetails(true);
      }
    } catch (err) {
      console.error("Fetch login details error:", err.message);
    } finally {
      setLoad(false);
    }
  };

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

  const isSuccess = payError === "Payment successful";
  useEffect(() => {
    if (!activeChat) return;

    const run = async () => {
      try {
        await markAsRead();
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    };

    run();
  }, [activeChat?.listing_id, activeChat?.lastmessagetime]);
  useEffect(() => {
    if (String(receiverId) === "1") {
      setLoad(false);
      return;
    }

    if (!chatId) return;
    if (loginDetails || cancel) return;

    let interval;

    const run = async () => {
      await fetchLoginDetails();
    };

    run();

    interval = setInterval(run, 3000);

    return () => clearInterval(interval);
  }, [chatId, receiverId]);

  if (loadingChats || sellerLoad || load) {
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

            <div className="flex-1 overflow-y-auto thin-scroll">
              {conversations.map((chat) => {
                const isActive = isSystemChat
                  ? chat.receiver_id === 1 && chat.listing_id === "1"
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
                          className="fill-green-600 fixed -mt-3 ml-8 text-green-100"
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
          {buyModal && selectedListing && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] max-w-md p-5 rounded-xl space-y-3 shadow-xl">
                <h2 className="text-lg font-bold text-blue-700">
                  Confirm Purchase
                </h2>
                {payError && (
                  <p
                    className="bg-red-50 border flex justify-center border-red-300 p-2 rounded text-sm "
                    style={{ color: isSuccess ? "green" : "red" }}
                  >
                    {payError}
                  </p>
                )}
                {/* GAME DETAILS */}
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Game:</strong> {selectedListing.gamedetails}
                  </p>
                  <p>
                    <strong>Seller:</strong> {selectedListing.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedListing.email}
                  </p>
                  <p>
                    <strong>Price:</strong> ₦
                    {Number(selectedListing.price).toLocaleString()}
                  </p>
                </div>

                {/* WARNING */}
                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded text-xs text-gray-700">
                  Make sure you confirm all details before payment. Refunds are
                  only possible via dispute system.
                </div>
                {/* PAYMENT METHOD */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Choose Payment Method</p>

                  <button
                    onClick={() => setPaymentMethod("paystack")}
                    className={`w-full py-2 rounded border ${
                      paymentMethod === "paystack"
                        ? "bg-blue-100 border-blue-500"
                        : ""
                    }`}
                  >
                    Pay with Paystack
                  </button>

                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`w-full py-2 rounded border ${
                      paymentMethod === "wallet"
                        ? "bg-blue-100 border-blue-500"
                        : ""
                    }`}
                  >
                    Pay with Account Balance
                  </button>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBuyModal(false);
                      setPayError("");
                      setPaymentMethod("");
                    }}
                    className="w-1/2 bg-gray-200 py-2 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={async () => {
                      if (!paymentMethod) {
                        setPayError("Select a payment method");
                        return;
                      }

                      try {
                        setBuy(true);
                        setPayError("");

                        const res = await fetch(
                          "/api/paystack/buy/initialize",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              listingId: selectedListing.listing_id || gameId,
                              receiverId,
                              paymentMethod, // 👈 IMPORTANT
                            }),
                          },
                        );

                        const data = await res.json();

                        if (paymentMethod === "paystack") {
                          if (data.authorization_url) {
                            window.location.href = data.authorization_url;
                          }
                        } else {
                          // wallet payment
                          if (data.success) {
                            setBuyModal(false);
                            setSuccessModal(true);
                          } else {
                            setPayError(data.error);
                          }
                        }
                      } catch (err) {
                        console.error(err);
                        setPayError("Payment error");
                      } finally {
                        setBuy(false);
                      }
                    }}
                    disabled={buy}
                    className="w-1/2 bg-blue-600 text-white py-2 rounded"
                  >
                    {!buy ? " Proceed to Pay" : "Loading..."}
                  </button>
                </div>
              </div>
            </div>
          )}
          {successModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] max-w-md p-6 rounded-xl shadow-xl text-center space-y-4">
                {/* ICON */}
                <div className="flex justify-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* TITLE */}
                <h2 className="text-xl font-bold text-green-600">
                  Payment Successful 🎉
                </h2>

                {/* MESSAGE */}
                <p className="text-gray-600 text-sm">
                  Your payment was successful.
                </p>

                <p className="text-sm text-gray-700 font-medium">
                  The seller will be notified. Kindly stay available for the
                  login details.
                </p>

                {/* ACTION */}
                <button
                  onClick={() => {
                    setSuccessModal(false);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded"
                >
                  Okay
                </button>
              </div>
            </div>
          )}
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
                        className="fill-green-600 fixed mt-7 ml-10 sm:ml-7 text-green-100"
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
                  {!isAdmin && !isSeller && activeChat?.status == "active" && (
                    <div className="h-10  flex items-center">
                      <button
                        onClick={() => {
                          setSelectedListing(activeChat);
                          setBuyModal(true);
                        }}
                        className="inline-flex sm:h-8 h-7 p-2 gap-1 sm:gap-2 min-w-0 rounded-md text-xs sm:text-sm items-center justify-center bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CreditCard size={15} />{" "}
                        <p className="inline-flex ">Pay</p>
                      </button>
                    </div>
                  )}

                  {cancel && showDetails && activeChat?.status != "active" && (
                    <div className="h-10  flex items-center">
                      {" "}
                      <button
                        onClick={() => {
                          setLoginDetails(true);
                          setCancel(false);
                        }}
                        className="inline-flex sm:h-8 h-7 p-2 gap-1 sm:gap-2 min-w-0 rounded-md text-xs sm:text-sm items-center justify-center bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Details
                      </button>{" "}
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
                    <div className="flex justify-center w-full">
                      <div className="fixed px-6">
                        {isSeller &&
                          activeChat?.status == "pending" &&
                          !loginDetails && (
                            <LoginDropBox
                              conversationId={chatId}
                              listingId={gameId}
                            />
                          )}
                      </div>
                    </div>
                    {loginDetails &&
                      !cancel &&
                      !isSeller &&
                      activeChat?.status == "pending" && (
                        <div className="flex justify-center w-full">
                          <div className="fixed bg-white w-[90%] max-w-md p-5 rounded-xl shadow-xl space-y-4">
                       <div className="flex justify-between">
                            <h2 className="text-lg font-bold text-blue-700">
                              Login Released 🔓
                            </h2>
                       
                            <button
                              onClick={() => {
                                setLoginDetails(false);
                                setCancel(true);
                              }}
                              className="text-red-50 h-5 w-5 flex items-center hover:text-red-200 duration-200 transition-all rounded-3xl bg-red-500 hover:bg-red-700 p-1"
                            >
                              <X size={14} className="font-bold" />
                            </button></div>

                            <p className="text-sm text-gray-600">
                              Seller has submitted login details.
                            </p>
                            {disputeError && (
                              <div className="text-red-500 text-sm text-center">
                                {disputeError}
                              </div>
                            )}
                            {!showDetails && (
                              <div className="space-y-3">
                                <p className="text-red-600 text-sm font-medium">
                                  ⚠️ You have 30 minutes to confirm once you
                                  view details.
                                </p>

                                <p className="text-xs text-gray-500">
                                  Make sure you have stable internet before
                                  proceeding.
                                </p>

                                <button
                                  onClick={handleShowDetails}
                                  disabled={loadDet}
                                  className="w-full bg-blue-600 text-white py-2 rounded-lg"
                                >
                                  {loadDet
                                    ? "Loading..."
                                    : "Show Login Details"}
                                </button>
                              </div>
                            )}

                            {showDetails && (
                              <div className="space-y-3">
                                {loginData.map((item, index) => (
                                  <div
                                    key={index}
                                    className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap"
                                  >
                                    {item.details}
                                  </div>
                                ))}

                                <div className="text-center text-sm text-red-600 font-bold tracking-wide">
                                  Time left: {timeLeft}
                                </div>

                                <button
                                  onClick={() => {
                                    setLoginDetails(false);
                                    setCancel(true);
                                  }}
                                  className="w-full text-sm bg-green-600 text-white py-2 rounded-lg"
                                >
                                  Confirm Login Works
                                </button>

                                <button
                                  onClick={async () => {
                                    try {
                                      setDisputeLoad(true);
                                      setDisputeError("");
                                      const res = await fetch(
                                        `/api/c/${gameId}/dispute?conversationId=${chatId}`,
                                        {
                                          method: "POST",
                                        },
                                      );

                                      const data = await res.json();

                                      if (!res.ok) {
                                        throw new Error(
                                          data?.error ||
                                            "Failed to raise dispute",
                                        );
                                      }
                                      setLoginDetails(false);
                                      setLoginModal(false);
                                      setCancel(true);
                                    } catch (err) {
                                      setDisputeError(err.message);
                                    } finally {
                                      setDisputeLoad(false);
                                    }
                                  }}
                                  className="w-full text-sm bg-red-600 text-white py-2 rounded-lg"
                                >
                                  {disputeLoad
                                    ? "Loading..."
                                    : "I didn’t get access"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
