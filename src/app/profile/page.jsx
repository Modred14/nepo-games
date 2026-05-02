"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useRef } from "react";
import {
  Eye,
  EyeOff,
  Upload,
  Lock,
  User,
  Shield,
  Bell,
  Link,
  Camera,
  LogOut,
  CreditCard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Loader from "@/components/Loader";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [load, setLoad] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          router.push("/login");
          return;
        }

        // ❌ Other errors (500, 404, etc)
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return; // stay on page
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        // 🌐 Network error lands here
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setLoad(false);
      }
    };

    fetchUser();
  }, []);
  const changeTab = (tab) => {
    if (globalLoading) return;
    setActiveTab(tab);
    router.push(`?tab=${tab}`);
  };

  if (loading || load) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <h1 className="text-blue-600 text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Account Settings
      </h1>

      {/* Mobile Tabs */}
      <div className="flex md:hidden overflow-x-auto thin-scroll gap-2 mb-4 ">
        <MobileTab
          label="Profile"
          active={activeTab === "profile"}
          onClick={() => changeTab("profile")}
        />
        <MobileTab
          label="Account"
          active={activeTab === "account"}
          onClick={() => changeTab("account")}
        />
        <MobileTab
          label="Security"
          active={activeTab === "password"}
          onClick={() => changeTab("password")}
        />
        <MobileTab
          label="Linked Account"
          active={activeTab === "linked"}
          onClick={() => changeTab("linked")}
        />
        <MobileTab
          label="Data & Privacy "
          active={activeTab === "data"}
          onClick={() => changeTab("data")}
        />
        {/* <MobileTab
          label="Notifications"
          active={activeTab === "notifications"}
          onClick={() => !globalLoading && setActiveTab("notifications")}
        /> */}
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden h-fit md:block bg-white shadow rounded-xl p-4 w-60">
          <TabButton
            icon={<User size={16} />}
            label="Profile Information"
            active={activeTab === "profile"}
            onClick={() => changeTab("profile")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<CreditCard size={16} />}
            label="Account"
            active={activeTab === "account"}
            onClick={() => changeTab("account")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Lock size={16} />}
            label="Security"
            active={activeTab === "password"}
            onClick={() => changeTab("password")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Link size={16} />}
            label="Linked Account"
            active={activeTab === "linked"}
            onClick={() => changeTab("linked")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Shield size={16} />}
            label="Data & Privacy"
            active={activeTab === "data"}
            onClick={() => changeTab("data")}
            disabled={globalLoading}
          />
          {/* <TabButton
            icon={<Bell size={16} />}
            label="Notifications"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            disabled={globalLoading}
          /> */}
        </div>

        {/* Content */}
        <div
          className={`flex-1 ${
            globalLoading ? "pointer-events-none opacity-80" : ""
          }`}
        >
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "account" && <AccountTab />}
          {activeTab === "password" && (
            <PasswordTab setGlobalLoading={setGlobalLoading} />
          )}
          {activeTab === "linked" && <LInkedTab />}
          {activeTab === "data" && <DataTab />}
          {/* {activeTab === "notifications" && <NotificationTab />} */}
        </div>
      </div>
    </div>
  );
}

function MobileTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-sm text-xs whitespace-nowrap ${active ? "bg-blue-600 text-white" : "bg-white border"}`}
    >
      {label}
    </button>
  );
}

function TabButton({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md mb-2 text-sm font-medium transition ${
        active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
      } ${disabled ? "opacity-90 cursor-not-allowed" : ""}`} // ✅ ADDED
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileTab() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          router.push("/login");
          return;
        }

        // ❌ Other errors (500, 404, etc)
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return; // stay on page
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        // 🌐 Network error lands here
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setLoad(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("nepo-user");

    await signOut({
      callbackUrl: "/login",
    });
  };

  if (loading || load) {
    return <Loader />;
  }
  const handleUpload = async (e) => {
    setError("");
    setCorrect("");
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("File must be less than 2MB");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", user.id);

    try {
      setLoading(true);
      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setCorrect("");
        setError(data.error);
        return;
      }

      // update UI instantly
      const updatedUser = {
        ...user,
        profile_image: data.imageUrl,
      };

      setUser(updatedUser);
      localStorage.setItem("nepo-user", JSON.stringify(updatedUser));
      setCorrect("Profile picture updated successfully.");
      setError("");
    } catch (err) {
      console.error(err);
      setCorrect("");
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };
  const handleRemove = async (e) => {
    setError("");
    setCorrect("");
    setSelectedFile("");

    const formData = new FormData();
    formData.append("userId", user.id);

    try {
      setLoading(true);
      const res = await fetch("/api/user/default", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setCorrect("");
        setError(data.error);
        return;
      }

      // update UI instantly
      const updatedUser = {
        ...user,
        profile_image: data.imageUrl,
      };

      setUser(updatedUser);
      localStorage.setItem("nepo-user", JSON.stringify(updatedUser));
      setCorrect("Profile picture updated successfully.");
      setError("");
    } catch (err) {
      console.error(err);
      setCorrect("");
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-blue-400">
      <div className="pb-1 sm:pb-0 sm:text-start sm:pl-36 text-center w-full">
        {error ? (
          <p className="text-red-500 text-sm mb-1">{error}</p>
        ) : (
          correct && <p className="text-green-500 text-sm mb-1">{correct}</p>
        )}{" "}
      </div>{" "}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="relative mx-auto sm:mx-0 w-25 h-25 sm:w-30 sm:h-30">
          <input
            type="file"
            id="profile-upload"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              setCorrect("");
              const file = e.target.files[0];
              if (!file) return;

              setSelectedFile(file);

              const imageUrl = URL.createObjectURL(file);

              setUser((prev) => ({
                ...(prev || {}),
                profile_image: imageUrl,
              }));

              setError(
                "Click the upload button to update your profile picture",
              );
            }}
          />

          <label
            htmlFor="profile-upload"
            className="cursor-pointer block w-full h-full"
          >
            <div className="w-full h-full rounded-full bg-blue-200 border border-blue-600 overflow-hidden">
              {imgLoading && (
                <div className="absolute inset-0  rounded-full flex items-center justify-center bg-gray-100">
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={user?.profile_image || "/placeholder.png"}
                alt="Profile"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imgLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
              />
            </div>

            <div className="absolute bottom-0 right-0 border mr-2 sm:mr-3 border-white bg-blue-600 p-1 rounded-full text-white">
              <Camera size={15} />
            </div>
          </label>
        </div>
        <div className="w-full sm:w-fit flex flex-col gap-2 sm:items-start items-center">
          <div className="flex flex-row gap-3 items-center ">
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-xs sm:text-sm transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload Photo
                </>
              )}
            </button>
            <button
              disabled={loading}
              onClick={handleRemove}
              className={`border border-blue-400/70 bg-gray-100 hover:bg-gray-200 transition-all duration-300 px-4 py-2 rounded-md text-xs sm:text-sm   ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Remove
            </button>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-500 w-full">
            JPG, PNG or WEBP. Max size of 2MB
          </p>
        </div>
      </div>
      <hr className="my-4 sm:my-6 border-blue-400" />
      <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 flex flex-wrap">
        <Info
          label="Full Name"
          value={
            user?.first_name
              ? `${user.first_name} ${user.surname}`
              : "Loading..."
          }
          user={user}
          setUser={setUser}
        />
        <Info label="User Name" value={user?.username || "Loading..."} />
        <Info label="E-Mail" value={user?.email || "Loading..."} />
      </div>
      {list.length > 0 && (
        <div>
          <hr className="my-4 sm:my-6 border-blue-400" />
          <div>
            <div className="">
              <p>Listed games</p>
            </div>
          </div>
        </div>
      )}
      <div className="mt-5 w-full flex items-center rounded-sm border border-red-200 bg-red-50 p-5  justify-between gap-4 shadow-sm">
        {/* Left content */}
        <div className="flex items-start gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Log out</h3>
            <p className="text-sm text-gray-600 mt-1">
              You’ll be signed out of this device. You can sign in again
              anytime.
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 gap-2 flex items-center bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 active:scale-95"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Confirm logout</h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to log out of this device?
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  const formatMoney = (val) =>
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <div className="bg-white shadow rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">
        ₦{formatMoney(value || 0)}
      </p>
    </div>
  );
}

function TransactionItem({ tx }) {
  const isCredit = tx.type === "credit";
  const formatMoney = (value) =>
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="flex justify-between items-center border-b pb-2 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{tx.description}</p>
        <p className="text-xs text-gray-400">
          {new Date(tx.created_at).toLocaleString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="text-right">
        <p
          className={`text-sm font-semibold ${
            isCredit ? "text-green-600" : "text-red-500"
          }`}
        >
          {isCredit ? "+" : "-"}₦{formatMoney(Number(tx.amount || 0))}
        </p>

        <p
          className={`text-xs ${
            tx.status === "success"
              ? "text-green-500"
              : tx.status === "pending"
                ? "text-yellow-500"
                : "text-red-500"
          }`}
        >
          {tx.status}
        </p>
      </div>
    </div>
  );
}

function PinGetInput({ value = "", onChange }) {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ""); // only numbers
    if (!val) return;

    const newValue = value.split("");
    newValue[index] = val[0];

    const final = newValue.join("").slice(0, 4);
    onChange(final);

    // auto move next
    if (index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newValue = value.split("");
      newValue[index] = "";
      onChange(newValue.join(""));

      // move back if empty
      if (!value[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    onChange(paste);

    paste.split("").forEach((char, i) => {
      if (inputs.current[i]) {
        inputs.current[i].value = char;
      }
    });
  };

  return (
    <div className="flex gap-3 mt-3 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          ref={(el) => (inputs.current[i] = el)}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-10 h-10 text-center text-lg border rounded-lg
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none transition"
        />
      ))}
    </div>
  );
}

function AccountTab() {
  const [balance, setBalance] = useState(0.0);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [withdrawPin, setWithdrawPin] = useState("");
  const [showLine, setShowLine] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState("free");
  const [amount, setAmount] = useState("");
  const [savedBanks, setSavedBanks] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [gettingAccountName, setGettingAccountName] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          router.push("/login");
          return;
        }

        // ❌ Other errors (500, 404, etc)
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return; // stay on page
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        // 🌐 Network error lands here
        console.error("Network error:", err);
        setUser(null);
      } 
    };

    fetchUser();
  }, []);

  const currentTransactions = transactions.slice(start, end);
  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) return;

    setGettingAccountName(true);
    setAccountName("");

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/paystack/resolve-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountNumber, bankCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setAccountName("");
          return;
        }

        setAccountName(data.account_name); // ✅ correct key
      } catch (err) {
        console.error(err);
        setAccountName("");
      } finally {
        setGettingAccountName(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [accountNumber, bankCode]);

  const fetchAccount = async () => {
   
    try {
      const res = await fetch("/api/user/account");

      if (!res.ok) {
        console.error("Failed to load account");
        return;
      }

      const data = await res.json();

      setBalance(Number(data.balance || 0));
      setTransactions(data.transactions || []);
      setUserPlan(data.plan);
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);
  const triggerAnimation = () => {
    setShowLine(false);

    requestAnimationFrame(() => {
      setShowLine(true);
    });
  };
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab) {
      triggerAnimation();
    }
  }, [searchParams]);

  const handleAddMoney = async () => {
    const value = Number(amount);

    if (!value || value < 100) {
      setError("Amount must be greater than ₦100.00");
      return;
    }

    try {
      setLoadingPay(true);

      const res = await fetch("/api/paystack/wallet/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          purpose: "wallet",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        setLoadingPay(false);
        return;
      }

       window.location.href = data.url;
    } catch (err) {
      console.error("Payment init failed:", err);
      setLoadingPay(false);
    }
  };
  const formatMoney = (value) =>
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  useEffect(() => {
    const fetchBanks = async () => {
      const res = await fetch("https://api.paystack.co/bank?country=nigeria", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
        },
      });

      const data = await res.json();
      setBanks(data.data);
    };

    fetchBanks();
  }, []);

  const handleWithdraw = async () => {
    const value = Number(withdrawAmount);

    // ❌ invalid input
    if (!value || value <= 0) {
      setWithdrawError("Enter a valid amount");
      return;
    }
    if (!withdrawPin || withdrawPin.length !== 4) {
      setWithdrawError("Enter valid PIN");
      return;
    }

    // ❌ below minimum
    if (value < 100) {
      setWithdrawError("Minimum withdrawal is ₦100.00");
      return;
    }

    // ❌ exceeds balance
    if (value > balance) {
      setWithdrawError("Insufficient balance");
      return;
    }

    try {
      setLoadingWithdraw(true);

      const res = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: value,
          accountNumber,
          bankCode,
          accountName,
          pin: withdrawPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setWithdrawError(data.error || "Withdrawal failed");
        setLoadingWithdraw(false);
        return;
      }

      // ✅ success
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawError("");

     fetchAccount();
    } catch (err) {
      console.error(err);
      setWithdrawError("Network error");
    } finally {
      setLoadingWithdraw(false);
    }
  };
  const fetchBanks = async () => {
    const res = await fetch("/api/user/get-banks");
    const data = await res.json();
    setSavedBanks(data.banks || []);
  };
  useEffect(() => {
    fetchBanks();
  }, []);
  const maskAccountNumber = (acc) => {
    if (!acc || acc.length < 7) return acc;

    const first = acc.slice(0, 4);
    const last = acc.slice(-3);
    const stars = "*".repeat(acc.length - 7);

    return `${first}${stars}${last}`;
  };
  const getFirstTwoNames = (fullName) => {
    return fullName.split(" ").slice(0, 2).join(" ");
  };
  const getFirstName = (fullName) => {
    return fullName.split(" ").slice(0, 3).join(" ");
  };
  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      {showPinConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {user?.pin_set ? (
            <div className="w-[90%] border border-black/25 max-w-sm bg-white rounded-xl p-4 shadow-lg">
              <p className="text-base font-semibold text-center">
                Confirm Transaction PIN
              </p>

              <p className="text-xs text-gray-500 text-center mt-1">
                Enter your PIN to complete withdrawal
              </p>

              {withdrawError && (
                <p className="text-xs text-red-600 text-center mt-2">
                  {withdrawError}
                </p>
              )}

              {/* PIN INPUT */}
              <div className="mt-4">
                <PinGetInput value={withdrawPin} onChange={setWithdrawPin} />
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowPinConfirm(false);
                    setWithdrawPin("");
                  }}
                  className="flex-1 border py-2 rounded-md text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={handleWithdraw}
                  disabled={loadingWithdraw}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm"
                >
                  {loadingWithdraw ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          ) : (
              <div className="w-[90%] max-w-sm bg-white rounded-xl border border-black/40 p-4 shadow-lg">
              <p className=" font-semibold text-gray-900 text-center">
                Transaction PIN Required
              </p>

              <p className="text-sm text-gray-600 text-center mt-2">
                You need to set your transaction PIN before continuing.
              </p>

              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    router.push("/profile?tab=password");
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-700 transition duration-200"
                >
                  Set PIN
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800">Fund Wallet</h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter amount you want to add
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (₦)"
              className="w-full mt-4 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAmount("");
                  setError("");
                }}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleAddMoney}
                disabled={loadingPay}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingPay ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800">
              Withdraw Funds
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter amount you want to withdraw
            </p>

            {withdrawError && (
              <p className="text-sm text-red-600">{withdrawError}</p>
            )}
            {savedBanks.length > 0 && userPlan !== "free" && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Recent accounts</p>

                <div className="space-y-2 xs:grid grid-cols-3 gap-1">
                  {savedBanks.map((b, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setAccountNumber(b.account_number);
                        setAccountName(b.account_name);
                        setBankCode(b.bank_code);
                      }}
                      className="p-1 border h-full overflow-hidden rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <p className="text-xs font-medium">
                        {getFirstTwoNames(b.account_name)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {maskAccountNumber(b.account_number)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getFirstName(b.bank_name)}
                      </p>{" "}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount (₦)"
              className="w-full mt-4 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account Number"
              className="w-full mt-3 border rounded-lg px-3 py-2"
            />

            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full mt-3 border rounded-lg px-3 py-2"
            >
              <option value="">Select Bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={accountName}
              placeholder="Account Name"
              disabled
              className="w-full mt-3 border rounded-lg px-3 py-2"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  fetchAccount();
                  setShowWithdrawModal(false);
                  setAccountNumber("");
                  setAccountName("");
                  setGettingAccountName(true);
                  setBankCode("");
                  setWithdrawAmount("");
                  fetchBanks();
                  setWithdrawError("");
                }}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setWithdrawError("");

                  if (!withdrawAmount || !accountNumber || !bankCode) {
                    setWithdrawError("Complete all fields");
                    return;
                  }

                  setShowPinConfirm(true); // 👈 NEW STEP
                }}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-5">
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow overflow-hidden">
          {" "}
          <div className="flex items-center gap-3 mt-1">
            <div>
              {" "}
              <p className="text-sm opacity-80">Available Balance</p>
              <h2 className="text-3xl font-semibold">
                ₦{formatMoney(balance)}
              </h2>
            </div>
            {/* {showLine && (
              <svg
                className="w-12 h-12"
                viewBox="0 0 100 50"
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id="arrowThin"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="3"
                    markerHeight="3"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#00ff6a" />
                  </marker>
                </defs>

                <path
                  d="M0 40 Q50 0 100 10"
                  stroke="#00ff6a"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#arrowThin)"
                  className="animate-draw"
                />
              </svg>
            )} */}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
            >
              Add Money
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className={`border border-white px-4 py-2 rounded-md text-sm transition
    ${"hover:bg-white/10"}`}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total Earned"
            value={transactions
              .filter((t) => t.type === "credit" && t.status === "success")
              .reduce((sum, t) => sum + Number(t.amount || 0), 0)}
          />

          <StatCard
            label="Total Withdrawn"
            value={transactions
              .filter((t) => t.type === "debit" && t.status === "success")
              .reduce((sum, t) => sum + Number(t.amount || 0), 0)}
          />
          <div className="bg-white shadow rounded-xl p-3">
            <p className="text-xs text-gray-500">Transactions</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {transactions.length}
            </p>
          </div>
        </div>

        {/* 📜 TRANSACTION HISTORY */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Transaction History</h3>
            <button
              onClick={() =>
                setPage((p) =>
                  p < Math.ceil(transactions.length / ITEMS_PER_PAGE)
                    ? p + 1
                    : p,
                )
              }
              className="text-blue-600 text-xs hover:underline"
            >
              View more
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {currentTransactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
              <div className="flex items-center justify-between mt-5">
                {/* Left: info */}
                <p className="text-xs text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-700">{page}</span> of{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.max(
                      1,
                      Math.ceil(transactions.length / ITEMS_PER_PAGE),
                    )}
                  </span>
                </p>

                {/* Right: controls */}
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:scale-95 transition disabled:opacity-30"
                  >
                    ‹
                  </button>

                  {/* Current Page */}
                  <span className="text-xs font-semibold text-blue-600 px-1">
                    {page}
                  </span>

                  {/* Next */}
                  <button
                    onClick={() =>
                      setPage((p) =>
                        p < Math.ceil(transactions.length / ITEMS_PER_PAGE)
                          ? p + 1
                          : p,
                      )
                    }
                    disabled={
                      page >= Math.ceil(transactions.length / ITEMS_PER_PAGE)
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:scale-95 transition disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!input.trim()) return;
    setError("");
    setSuccess("");

    const parts = input.trim().split(" ");
    const first_name = parts[0];
    const surname = parts.slice(1).join(" ") || "";

    try {
      setLoading(true);

      const res = await fetch("/api/user/change-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          first_name,
          surname,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      const updatedUser = {
        ...user,
        first_name,
        surname,
      };

      setUser(updatedUser);
      localStorage.setItem("nepo-user", JSON.stringify(updatedUser));

      setSuccess("Name updated successfully");
      setError("");
      setEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      setError("Something went wrong. Try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const isFullName = label === "Full Name";
  if (loading) {
    return <Loader />;
  }
  return (
    <div>
      {error ? (
        <p className="text-red-500 text-sm mt-2 mb-2">{error}</p>
      ) : (
        success && <p className="text-green-500 mb-2 text-sm mt-2">{success}</p>
      )}
      <p className="text-blue-600 font-semibold text-sm">{label}</p>

      {isFullName && editing ? (
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border px-2 py-1 rounded text-sm w-fit"
          />
          <button onClick={handleSave} className="text-green-600 text-xs">
            ✔ Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-black text-sm sm:text-base">{value}</p>

          {isFullName && (
            <button
              onClick={() => {
                setEditing(true);
                setInput(value);
              }}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
function PinInput({ value = "", onChange }) {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ""); // only numbers

    if (!val) return;

    const newValue = value.split("");
    newValue[index] = val[0];

    const final = newValue.join("").slice(0, 4);
    onChange(final);

    // move to next input
    if (index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!value[index]) {
        inputs.current[index - 1]?.focus();
      }

      const newValue = value.split("");
      newValue[index] = "";
      onChange(newValue.join(""));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    onChange(paste);

    paste.split("").forEach((char, i) => {
      if (inputs.current[i]) {
        inputs.current[i].value = char;
      }
    });
  };

  return (
    <div className="flex gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="number"
          maxLength={1}
          ref={(el) => (inputs.current[i] = el)}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-10 h-10 text-center text-lg border border-gray-300 rounded-lg 
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
      ))}
    </div>
  );
}

function PasswordTab({ setGlobalLoading }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const cleanNewPin = String(pinForm.newPin).trim();
  const [correct, setCorrect] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [load, setLoad] = useState(true);

  const [error, setError] = useState("");
  const checks = {
    length: form.newPass.length >= 6,
    number: /\d/.test(form.newPass),
    special: /[^A-Za-z0-9]/.test(form.newPass),
    uppercase: /[A-Z]/.test(form.newPass),
  };

  const handleChangePin = async () => {
    if (pinLoading) return;

    setPinError("");
    setPinSuccess("");

    const cleanNewPin = String(pinForm.newPin).trim();

    if (!/^\d{4}$/.test(cleanNewPin)) {
      return setPinError("PIN must be exactly 4 digits");
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      return setPinError("PINs do not match");
    }

    if (user?.pin_set && !pinForm.currentPin) {
      return setPinError("Current PIN is required");
    }

    setPinLoading(true);

    try {
      const res = await fetch("/api/user/set-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPin: pinForm.currentPin,
          newPin: pinForm.newPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPinError(data.error);
        return;
      }

      setPinSuccess("PIN updated successfully");
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (err) {
      console.error(err);
      setPinError("Error updating PIN");
    } finally {
      setPinLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          router.push("/login");
          return;
        }

        // ❌ Other errors (500, 404, etc)
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return; // stay on page
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        // 🌐 Network error lands here
        console.error("Network error:", err);
        setUser(null);
      } finally {
        setLoad(false);
      }
    };

    fetchUser();
  }, []);

  const handleChangePassword = async () => {
    if (loading) return; // prevent spam clicks

    if (!form.current) return setError("Current password is required");
    if (form.newPass !== form.confirm)
      return setError("Passwords do not match");
    if (form.newPass.length < 6) return setError("Password too short");
    if (
      !checks.length ||
      !checks.number ||
      !checks.special ||
      !checks.uppercase
    ) {
      setError("Password must contain:");
      return;
    }
    setError("");
    setCorrect("");
    setLoading(true);
    setGlobalLoading(true); // ✅ ADDED

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: form.current,
          newPassword: form.newPass,
        }),
      });

      console.log(user.id, "this s=is it o");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setCorrect("");
        return;
      }

      setCorrect("Password updated successfully");
      setError("");

      setForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      console.error(err);
      setError("Error updating password");
      setCorrect("");
    } finally {
      setLoading(false);
      setGlobalLoading(false); // ✅ ADDED
    }
  };
  if (load) {
    return <Loader />;
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <div className="mb-7">
        <h2 className="text-base sm:text-lg font-semibold mb-1">
          {user?.pin_set ? "Change PIN" : "Set PIN"}
        </h2>

        <p className="text-gray-500 text-sm mb-4">
          {user?.pin_set
            ? "Enter your current PIN to change it"
            : "Set a 4-digit PIN for secure actions"}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePin();
          }}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 w-full">
            {user?.pin_set && (
              <div>
                <p className="text-sm mb-1 text-blue-600">Current PIN</p>
                <PinInput
                  value={pinForm.currentPin}
                  onChange={(val) =>
                    setPinForm({ ...pinForm, currentPin: val })
                  }
                />
              </div>
            )}

            <div>
              <p className="text-sm mb-1 text-blue-600">New PIN</p>
              <PinInput
                value={pinForm.newPin}
                onChange={(val) => setPinForm({ ...pinForm, newPin: val })}
              />
            </div>

            <div>
              <p className="text-sm mb-1 text-blue-600">Confirm PIN</p>
              <PinInput
                value={pinForm.confirmPin}
                onChange={(val) => setPinForm({ ...pinForm, confirmPin: val })}
              />
            </div>
          </div>

          {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}
          {pinSuccess && (
            <p className="text-green-500 text-sm mt-2">{pinSuccess}</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              disabled={pinLoading}
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:opacity-60"
            >
              {pinLoading ? (
                <p className="flex items-center text-sm gap-2">Updating...</p>
              ) : user?.pin_set ? (
                <p className="flex items-center text-sm gap-2">Update PIN</p>
              ) : (
                <p className="flex items-center text-sm gap-2">
                  <Lock size={16} /> Set PIN
                </p>
              )}
            </button>
          </div>
        </form>
      </div>
      <hr className=" border-gray-300" />
      <div>
        <h2 className="text-base mt-7 sm:text-lg font-semibold mb-1">
          Change Password
        </h2>
        <p className="text-gray-500 text-sm mb-4 sm:mb-6">
          Enter your current password to change your password
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <PasswordInput
              label="Current Password"
              value={form.current}
              onChange={(v) => setForm({ ...form, current: v })}
              show={show.current}
              toggle={() => setShow({ ...show, current: !show.current })}
              disabled={loading}
            />
            <PasswordInput
              label="New Password"
              value={form.newPass}
              onChange={(v) => setForm({ ...form, newPass: v })}
              show={show.newPass}
              toggle={() => setShow({ ...show, newPass: !show.newPass })}
              disabled={loading}
            />
            <PasswordInput
              label="Confirm Password"
              value={form.confirm}
              onChange={(v) => setForm({ ...form, confirm: v })}
              show={show.confirm}
              toggle={() => setShow({ ...show, confirm: !show.confirm })}
              disabled={loading}
            />
          </div>
          {error ? (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          ) : (
            correct && <p className="text-green-500 text-sm mt-2">{correct}</p>
          )}
          <div className="text-xs sm:text-sm mt-2 space-y-1">
            <CheckItem valid={checks.length} text="At least 6 characters" />
            <CheckItem valid={checks.number} text="Contains a number" />
            <CheckItem
              valid={checks.special}
              text="Contains a special character"
            />
            <CheckItem
              valid={checks.uppercase}
              text="Contains an uppercase letter"
            />
          </div>

          <div className="mt-6 flex justify-center sm:justify-end">
            <button
              disabled={loading}
              type="submit"
              className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded-md flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  <p className="flex items-center text-sm gap-2">Updating...</p>
                </>
              ) : (
                <p className="flex items-center text-sm gap-2">
                  <Lock size={16} /> Update password
                </p>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function CheckItem({ valid, text }) {
  return (
    <p
      className={`flex items-center gap-2 ${valid ? "text-green-600" : "text-gray-500"}`}
    >
      <span className={`text-sm ${valid ? "text-green-600" : "text-gray-400"}`}>
        {valid ? "✔" : "○"}
      </span>
      {text}
    </p>
  );
}
function PasswordInput({ label, value, onChange, show, toggle }) {
  return (
    <div>
      <label className="text-blue-600 text-xs sm:text-sm">{label}</label>
      <div className="flex items-center border rounded-md px-3 mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password"
          className="flex-1 py-2 text-sm outline-none"
        />
        <button type="button" onClick={toggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function LInkedTab() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-6">
      {/* Header */}

      {/* Linked Account Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Linked Account
          </h2>
          <p className="text-xs text-gray-500">
            Sign in to{" "}
            <span className="text-blue-600 font-medium">Nepogames</span> using
            this third party account
          </p>
        </div>

        {/* Google Card */}
        <div className="flex items-center my-7 justify-between border border-blue-200 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3">
            {/* Google Icon */}
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-6 h-6"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                Google Account
              </p>
              <p className="text-xs text-gray-500">Signed in with Google</p>
            </div>
          </div>

          {/* Connected Badge */}
          <div className="flex items-center gap-2 bg-green-100 text-green-600 text-[10px] xs:text-xs font-medium px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Connected
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-1">
          <p className="text-sm">
            <span className="text-blue-600 font-medium">Security Status</span>
            <span className="text-green-500"> : Strong</span>
          </p>

          <Lock size={15} className="text-green-500" />
        </div>
      </div>

      {/* Security Illustration */}
      <div className="flex justify-center">
        <div className="relative">
          <img
            src="/security-shield.png"
            alt="Security"
            className=" opacity-95"
          />
        </div>
      </div>
    </div>
  );
}

function DataTab() {
  const router = useRouter();
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Data & Privacy
        </h2>
        <p className="text-xs text-gray-500">Last updated: April 2026</p>
        <p className="text-xs pt-5 sm:text-sm text-gray-500">
          By using{" "}
          <span className="text-blue-600 font-semibold">Nepogames</span> you
          agree to these terms and conditions. Please read our{" "}
          <a
            onClick={() => router.push(`/terms-of-service`)}
            className="text-blue-600 font-semibold"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            onClick={() => router.push(`/privacy-policy`)}
            className="text-blue-600 font-semibold"
          >
            Privacy Policy
          </a>{" "}
          carefully before using our platform
        </p>
      </div>

      {/* Divider line */}
      <div className="h-px w-full bg-gray-100" />

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 relative">
        {/* Vertical divider for desktop */}
        <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-100" />

        {/* Terms */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Terms of Service
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: April 2026
            </p>
          </div>
          <a onClick={() => router.push(`/terms-of-service`)}>
            <button
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0000FF] text-white text-sm font-medium
        hover:opacity-90 transition active:scale-[0.98]"
            >
              Terms of service
            </button>
          </a>
        </div>

        {/* Privacy */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Privacy Policy
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: April 2026
            </p>
          </div>
          <a onClick={() => router.push(`/privacy-policy`)}>
            <button
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0000FF] text-white text-sm font-medium
        hover:opacity-90 transition active:scale-[0.98]"
            >
              Privacy Policy
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

function NotificationTab() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">Notifications</h2>
      <Toggle label="Email Notifications" storageKey="emailNotif" />
      <Toggle label="SMS Notifications" storageKey="smsNotif" />
      <Toggle label="Marketing Updates" storageKey="marketing" />
    </div>
  );
}

function Toggle({ label, storageKey }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setEnabled(JSON.parse(saved));
  }, [storageKey]);

  const toggle = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    localStorage.setItem(storageKey, JSON.stringify(newVal));
  };

  return (
    <div className="flex justify-between items-center">
      <p className="text-sm">{label}</p>
      <button
        onClick={toggle}
        className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full p-1 transition ${enabled ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <div
          className={`w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full transition ${enabled ? "translate-x-5 sm:translate-x-6" : ""}`}
        />
      </button>
    </div>
  );
}
