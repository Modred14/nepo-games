// File: src/app/profile/ProfileClient.jsx
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
  X,
  Pencil,
  Mail,
  AtSign,
  Link as LinkIcon,
  Camera,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Loader from "@/components/Loader";
import Link from "next/link";

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
    } else {
      router.replace("/profile?tab=profile");
    }
  }, [searchParams, router]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");

        // 🔥 ONLY redirect if truly unauthorized
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <h1 className="text-blue-600 text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Account Settings
      </h1>

      {/* Mobile Tabs */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 mb-4 pb-1 scrollbar-none">
        {[
          { label: "Profile", tab: "profile", icon: <User size={12} /> },
          { label: "Account", tab: "account", icon: <CreditCard size={12} /> },
          { label: "Security", tab: "password", icon: <Lock size={12} /> },
          { label: "Linked", tab: "linked", icon: <LinkIcon size={12} /> },
          { label: "Privacy", tab: "data", icon: <Shield size={12} /> },
        ].map(({ label, tab, icon }) => (
          <button
            key={tab}
            onClick={() => changeTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap
        transition-all duration-200 flex-shrink-0 border
        ${
          activeTab === tab
            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
            : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500"
        }`}
          >
            {icon}
            {label}
          </button>
        ))}
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
            icon={<LinkIcon size={16} />}
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
          {activeTab === "profile" && (
            <ProfileTab user={user} load={load} setUser={setUser} />
          )}
          {activeTab === "account" && <AccountTab user={user} />}
          {activeTab === "password" && (
            <PasswordTab
              user={user}
              load={load}
              setUser={setUser}
              setGlobalLoading={setGlobalLoading}
            />
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

function InfoRow({ icon: Icon, label, updateUser, user, value, editable }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const { update } = useSession();

  const handleOpen = () => {
    setDraft(value === "Loading..." ? "" : value);
    setErr("");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draft.trim()) {
      setErr("This field cannot be empty.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const [first, ...rest] = draft.trim().split(" ");
      const res = await fetch("/api/user/change-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          first_name: first,
          surname: rest.join(" "),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to save.");
        return;
      }
      updateUser((user) => ({
        ...user,
        first_name: first,
        surname: rest.join(" "),
      }));
      await update({ user: { first_name: first, surname: rest.join(" ") } });
      setEditing(false);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-[13.5px] font-medium text-gray-900 truncate">
          {value}
        </p>
      </div>
      {editable && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-1 text-[11.5px] font-medium text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
        >
          <Pencil size={11} />
          Edit
        </button>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[88%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Edit {label}
            </h2>
            <p className="text-xs text-gray-900 mb-4">
              Update your {label.toLowerCase()} below.
            </p>
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setErr("");
              }}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
            />
            {err && <p className="text-red-500 text-xs mt-1.5">{err}</p>}
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 ${
                  saving ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {saving && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ user, load, setUser }) {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [open, setOpen] = useState(false);

  const { update } = useSession();

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  if (loading || load) {
    return <ProfileTabSkeleton />;
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
      await update({ user: { profile_image: data.imageUrl } });

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
      await update({ user: { profile_image: data.imageUrl } });

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
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden  w-full">
      {/* ── Photo section ── */}
      <div className="flex flex-col items-center gap-4 px-6 pb-5 border-b border-blue-100">
        {/* Status message */}
        <div className="h-4 text-center">
          {error ? (
            <p className="text-red-500 text-xs">{error}</p>
          ) : correct ? (
            <p className="text-green-600 text-xs">{correct}</p>
          ) : null}
        </div>

        {/* Avatar */}
        <div className="flex  flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative w-30 h-30">
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
                setError("Click Upload Photo to save your new picture.");
              }}
            />
            <label
              htmlFor="profile-upload"
              className="cursor-pointer block w-full h-full"
            >
              <div className="w-full h-full rounded-full bg-blue-100 border-[2.5px] border-blue-500 overflow-hidden">
                {imgLoading && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-100">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
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
              <div className="absolute bottom-0.5 right-0.5 bg-blue-600 border-2 border-white rounded-full w-[26px] h-[26px] flex items-center justify-center">
                <Camera size={13} className="text-white" />
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2.5">
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    Upload Photo
                  </>
                )}
              </button>

              <button
                onClick={handleRemove}
                disabled={loading}
                className={`flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-[13px] font-medium border border-gray-200 px-4 py-2 rounded-lg transition-colors ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <X size={13} />
                Remove
              </button>
            </div>
            <p className="text-[11.5px] text-gray-400">
              JPG, PNG or WEBP. Max size of 2MB
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile Information ── */}
      <div className="px-6 pt-4 pb-1">
        <p className="text-[10.5px] font-semibold tracking-widest uppercase text-blue-600 mb-3">
          Profile Information
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <InfoRow
            icon={User}
            label="Full Name"
            value={
              user?.first_name
                ? `${user.first_name} ${user.surname}`
                : "Loading..."
            }
            user={user}
            updateUser={setUser}
            editable
          />
          <InfoRow
            icon={AtSign}
            label="User Name"
            value={user?.username || "Loading..."}
          />
          <InfoRow
            icon={Mail}
            label="E-Mail"
            value={user?.email || "Loading..."}
          />
        </div>
      </div>

      {/* ── Listed Games (conditional) ── */}
      {list.length > 0 && (
        <div className="px-6 pt-4">
          <p className="text-[10.5px] font-semibold tracking-widest uppercase text-blue-600 mb-3">
            Listed Games
          </p>
          {/* Render list items here */}
        </div>
      )}

      {/* ── Log Out ── */}
      <div className="px-6 pt-4 pb-5">
        <p className="text-[10.5px] font-semibold tracking-widest uppercase text-blue-600 mb-3">
          Log Out
        </p>
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">
              Sign out of this device
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              You'll be signed out of this device. You can sign in again
              anytime.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-medium px-3.5 py-2 rounded-lg transition-colors active:scale-95"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>
      </div>

      {/* ── Logout confirm modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[88%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">
              Confirm logout
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Are you sure you want to log out of this device?
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
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
function ProfileTabSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden w-full">
      {/* ── Photo section skeleton ── */}
      <div className="flex flex-col items-center gap-4 px-6 pb-5 border-b border-blue-100">
        {/* Status message placeholder */}
        <div className="h-4" />
        <div className="flex  flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
          {/* Avatar */}
          <div className="relative w-30 h-30">
            <div className="w-full h-full rounded-full bg-gray-200 animate-pulse border-[2.5px] border-blue-100" />
            <div className="absolute bottom-0.5 right-0.5 w-[26px] h-[26px] rounded-full bg-gray-300 animate-pulse border-2 border-white" />
          </div>

          {/* Buttons */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2.5">
              <div className="h-9 w-32 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-gray-200 animate-pulse" />
            </div>
            <div className="h-3 w-44 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>{" "}
      </div>

      {/* ── Profile Information skeleton ── */}
      <div className="px-6 pt-4 pb-1">
        <div className="h-3 w-36 rounded bg-gray-200 animate-pulse mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              {/* Icon bubble */}
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              {/* Text */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 w-16 rounded bg-gray-200 animate-pulse" />
                <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse" />
              </div>
              {/* Edit button only on first row */}
              {i === 0 && (
                <div className="h-6 w-14 rounded-md bg-gray-200 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Log Out skeleton ── */}
      <div className="px-6 pt-4 pb-5">
        <div className="h-3 w-16 rounded bg-gray-200 animate-pulse mb-3" />
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-36 rounded bg-red-200 animate-pulse" />
            <div className="h-3 w-52 rounded bg-red-200 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-red-300 animate-pulse shrink-0" />
        </div>
      </div>
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
        ₦ {formatMoney(value || 0)}
      </p>
    </div>
  );
}

// function TransactionItem({ tx }) {
//   const isCredit = tx.type === "credit";
//   const formatMoney = (value) =>
//     new Intl.NumberFormat("en-NG", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(value);

//   return (
//     <div className="flex justify-between items-center border-b pb-2 last:border-b-0">
//       <div>
//         <p className="text-sm font-medium">{tx.description}</p>
//         <p className="text-xs text-gray-400">
//           {new Date(tx.created_at).toLocaleString("en-NG", {
//             day: "numeric",
//             month: "short",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//           })}
//         </p>
//       </div>

//       <div className="text-right">
//         <p
//           className={`text-sm font-semibold ${
//             isCredit ? "text-green-600" : "text-red-500"
//           }`}
//         >
//           {isCredit ? "+" : "-"}₦{formatMoney(Number(tx.amount || 0))}
//         </p>

//         <p
//           className={`text-xs ${
//             tx.status === "success"
//               ? "text-green-500"
//               : tx.status === "pending"
//                 ? "text-yellow-500"
//                 : "text-red-500"
//           }`}
//         >
//           {tx.status}
//         </p>
//       </div>
//     </div>
//   );
// }

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

// ─── REPLACE ONLY AccountTab and AccountTabSkeleton ──────────────────────────
// All logic/state/handlers are untouched. Only markup + styling changed.

function AccountTab({ user }) {
  const [balance, setBalance] = useState(0.0);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [withdrawPin, setWithdrawPin] = useState("");
  const [showLine, setShowLine] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  // ── Dedicated Virtual Account (bank transfer funding) ──────────────
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [loadingVA, setLoadingVA] = useState(true);
  const [creatingVA, setCreatingVA] = useState(false);
  const [vaError, setVaError] = useState("");
  const [vaNeedsPhone, setVaNeedsPhone] = useState(false);
  const [vaPhone, setVaPhone] = useState("");
  const [vaUnavailable, setVaUnavailable] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [showVaModal, setShowVaModal] = useState(false);

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  const currentTransactions = transactions.slice(start, end);

  useEffect(() => { setLoadingWithdraw(false); }, []);

  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setGettingAccountName(true);
    setAccountName("");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/paystack/resolve-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountNumber, bankCode }),
        });
        const data = await res.json();
        if (!res.ok) { setAccountName(""); return; }
        setAccountName(data.accountName);
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
      if (!res.ok) { console.error("Failed to load account"); return; }
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

  useEffect(() => { fetchAccount(); }, []);

  const fetchVirtualAccount = async () => {
    try {
      const res = await fetch("/api/user/virtual-account");
      if (!res.ok) { setLoadingVA(false); return; }
      const data = await res.json();
      setVirtualAccount(data.virtualAccount || null);
    } catch (err) {
      console.error("Failed to load virtual account:", err);
    } finally {
      setLoadingVA(false);
    }
  };

  useEffect(() => { fetchVirtualAccount(); }, []);

  const handleActivateVirtualAccount = async () => {
    setVaError("");
    setCreatingVA(true);
    try {
      const body = vaNeedsPhone ? { phone: vaPhone } : {};
      const res = await fetch("/api/user/virtual-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "phone_required") {
          setVaNeedsPhone(true);
          setVaError(data.message || "Enter your phone number to continue.");
          return;
        }
        if (data.error === "dva_unavailable") {
          setVaUnavailable(true);
          setVaError(data.message || "Bank transfer funding isn't available yet.");
          return;
        }
        setVaError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setVirtualAccount(data.virtualAccount);
      setVaNeedsPhone(false);
      setVaPhone("");
    } catch (err) {
      console.error("Virtual account activation failed:", err);
      setVaError("Network error. Please try again.");
    } finally {
      setCreatingVA(false);
    }
  };

  const handleCopyVirtualAccount = () => {
    if (!virtualAccount?.account_number) return;
    navigator.clipboard.writeText(virtualAccount.account_number);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2000);
  };

  const triggerAnimation = () => {
    setShowLine(false);
    requestAnimationFrame(() => { setShowLine(true); });
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) { triggerAnimation(); }
  }, [searchParams]);

  const handleAddMoney = async () => {
    const value = Number(amount);
    if (!value || value < 100) { setError("Amount must be greater than ₦100.00"); return; }
    try {
      setLoadingPay(true);
      const res = await fetch("/api/paystack/wallet/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), purpose: "wallet" }),
      });
      const data = await res.json();
      if (!res.ok) { console.error(data.error); setLoadingPay(false); return; }
      window.location.href = data.url;
    } catch (err) {
      console.error("Payment init failed:", err);
      setLoadingPay(false);
    }
  };

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  useEffect(() => {
    const fetchBanks = async () => {
      const res = await fetch("https://api.paystack.co/bank?country=nigeria", {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}` },
      });
      const data = await res.json();
      setBanks(data.data);
    };
    fetchBanks();
  }, []);

  const handleWithdraw = async () => {
    const value = Number(withdrawAmount);
    if (!value || value <= 0) { setWithdrawError("Enter a valid amount"); return; }
    if (!withdrawPin || withdrawPin.length !== 4) { setWithdrawError("Enter valid PIN"); return; }
    if (value < 100) { setWithdrawError("Minimum withdrawal is ₦100.00"); return; }
    if (value > balance) { setWithdrawError("Insufficient balance"); return; }
    try {
      setLoadingWithdraw(true);
      const res = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, accountNumber, bankCode, accountName, pin: withdrawPin }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawError(data.error || "Withdrawal failed"); setLoadingWithdraw(false); return; }
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawError("");
      fetchAccount();
      setShowPinConfirm(false)
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

  useEffect(() => { fetchBanks(); }, []);

  const maskAccountNumber = (acc) => {
    if (!acc || acc.length < 7) return acc;
    const first = acc.slice(0, 4);
    const last = acc.slice(-3);
    const stars = "*".repeat(acc.length - 7);
    return `${first}${stars}${last}`;
  };

  const getFirstTwoNames = (fullName) => fullName.split(" ").slice(0, 2).join(" ");
  const getFirstName = (fullName) => fullName.split(" ").slice(0, 3).join(" ");

  if (loading) return <AccountTabSkeleton />;

  return (
    <>
      {/* ── Styles ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes at-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes at-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes at-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .at-card { animation: at-fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .at-card:nth-child(1) { animation-delay: 0s; }
        .at-card:nth-child(2) { animation-delay: 0.05s; }
        .at-card:nth-child(3) { animation-delay: 0.10s; }
        .at-card:nth-child(4) { animation-delay: 0.15s; }

        .at-overlay { animation: at-fadeIn 0.2s ease both; }
        .at-modal {
          animation: at-fadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both;
        }

        .at-balance-card {
          background: linear-gradient(135deg, #1a56db 0%, #1e40af 60%, #1e3a8a 100%);
          position: relative;
          overflow: hidden;
        }
        .at-balance-card::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .at-balance-card::after {
          content: "";
          position: absolute;
          bottom: -40px; left: 20px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }

        .at-btn-add {
          background: rgba(255,255,255,0.95);
          color: #1a56db;
          border: none;
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          letter-spacing: 0.01em;
        }
        .at-btn-add:hover { background: #fff; transform: translateY(-1px); }
        .at-btn-add:active { transform: translateY(0); }

        .at-btn-withdraw {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.12s;
        }
        .at-btn-withdraw:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.5); transform: translateY(-1px); }
        .at-btn-withdraw:active { transform: translateY(0); }

        .at-stat {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 14px 16px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .at-stat:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }

        .at-history {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
        }

        .at-tx-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }
        .at-tx-row:last-child { border-bottom: none; }

        .at-tx-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 15px;
        }

        .at-page-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .at-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
        .at-page-btn:active:not(:disabled) { transform: scale(0.95); }
        .at-page-btn:disabled { opacity: 0.3; cursor: default; }

        /* Modal inputs */
        .at-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fafafa;
          box-sizing: border-box;
        }
        .at-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: #fff; }
        .at-input:disabled { opacity: 0.6; cursor: default; background: #f8fafc; }

        .at-select {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s;
          background: #fafafa;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
          box-sizing: border-box;
        }
        .at-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background-color: #fff; }

        .at-modal-btn-ghost {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 0;
          font-size: 13.5px;
          font-weight: 500;
          color: #475569;
          background: #fff;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .at-modal-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

        .at-modal-btn-primary {
          flex: 1;
          border: none;
          border-radius: 10px;
          padding: 10px 0;
          font-size: 13.5px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          cursor: pointer;
          transition: opacity 0.15s, transform 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .at-modal-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .at-modal-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .at-modal-btn-primary:disabled { opacity: 0.55; cursor: default; }

        .at-saved-bank {
          padding: 8px 10px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.12s;
          overflow: hidden;
        }
        .at-saved-bank:hover { border-color: #93c5fd; background: #eff6ff; transform: translateY(-1px); }

        .at-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .at-badge-success {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.02em;
        }

        .at-view-more {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
          letter-spacing: 0.01em;
        }
        .at-view-more:hover { background: #eff6ff; }

        /* PIN overlay input */
        .at-pin-box {
          width: 46px; height: 50px;
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          background: #f8fafc;
          color: #0f172a;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .at-pin-box:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: #fff; }

        /* Virtual account — bank card */
        .at-va-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          padding: 20px 20px 18px;
          background:
            radial-gradient(circle at 88% -10%, rgba(255,255,255,0.10), transparent 55%),
            linear-gradient(135deg, #0f2f7a 0%, #1a56db 55%, #2563eb 100%);
          box-shadow: 0 10px 30px -8px rgba(26,86,219,0.45);
        }
        .at-va-card::before {
          content: "";
          position: absolute;
          top: -70px; right: -50px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .at-va-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 10px);
          pointer-events: none;
        }
        .at-va-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .at-va-chip {
          width: 34px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.06);
        }
        .at-va-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 3px 10px 3px 8px;
          border-radius: 20px;
        }
        .at-va-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 2px rgba(74,222,128,0.25);
        }
        .at-va-number-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
        }
        .at-va-number {
          display: flex;
          gap: 10px;
          font-family: "SF Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;
          font-size: clamp(19px, 5vw, 25px);
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.03em;
        }
        .at-va-group { white-space: nowrap; }
        .at-va-copy {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          color: #1a56db;
          background: rgba(255,255,255,0.95);
          border: none;
          border-radius: 9px;
          padding: 7px 12px;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
        }
        .at-va-copy:hover { background: #fff; transform: translateY(-1px); }
        .at-va-copy:active { transform: translateY(0); }
        .at-va-bottom-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.16);
        }
        .at-va-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin: 0 0 3px;
        }
        .at-va-value {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Compact "fund by transfer" strip inside the balance card */
        .at-va-strip {
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          text-align: left;
        }
        .at-va-strip:hover { background: rgba(255,255,255,0.13); transform: translateY(-1px); }
        .at-va-strip:active { transform: translateY(0); }
        .at-va-strip-chip {
          width: 30px; height: 22px; flex-shrink: 0;
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
        }
        .at-va-strip-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .at-va-strip-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
        }
        .at-va-strip-number {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          font-family: "SF Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;
          letter-spacing: 0.02em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .at-va-strip-arrow {
          flex-shrink: 0;
          color: rgba(255,255,255,0.65);
          display: flex;
        }

        /* Mobile refinements */
        @media (max-width: 480px) {
          .at-va-card { padding: 17px 16px 15px; border-radius: 16px; }
          .at-va-number { gap: 7px; font-size: clamp(17px, 5.5vw, 21px); }
          .at-va-number-row { margin-top: 16px; gap: 8px; }
          .at-va-bottom-row { margin-top: 18px; padding-top: 12px; gap: 8px; }
          .at-va-value { max-width: 120px; font-size: 12px; }
          .at-va-copy { padding: 6px 10px; font-size: 11px; }
          .at-va-strip { padding: 9px 10px; gap: 8px; }
        }
      `}</style>

      {/* ── PIN Confirm Overlay ───────────────────────────────────── */}
      {showPinConfirm && (
        <div className="at-overlay" style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
        }}>
          {user?.pin_set ? (
            <div className="at-modal" style={{
              width: "92%", maxWidth: 360,
              background: "#fff",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
            }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#eff6ff", margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Confirm your PIN</p>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Enter your 4-digit transaction PIN</p>
              </div>

              {withdrawError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 12, color: "#dc2626", textAlign: "center",
                  marginTop: 12,
                }}>
                  {withdrawError}
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <PinGetInput value={withdrawPin} onChange={setWithdrawPin} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button className="at-modal-btn-ghost"
                  onClick={() => { setShowPinConfirm(false); setWithdrawPin(""); }}>
                  Cancel
                </button>
                <button className="at-modal-btn-primary"
                  onClick={handleWithdraw}
                  disabled={loadingWithdraw}>
                  {loadingWithdraw ? <><span className="at-spin" /> Processing…</> : "Confirm withdrawal"}
                </button>
              </div>
            </div>
          ) : (
            <div className="at-modal" style={{
              width: "92%", maxWidth: 340,
              background: "#fff",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#fff7ed", margin: "0 auto 14px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>PIN not set</p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 6, marginBottom: 18 }}>
                You need a transaction PIN before withdrawing funds.
              </p>
              <Link href="/profile?tab=password">
                <button style={{
                  background: "#dc2626", color: "#fff",
                  border: "none", borderRadius: 10,
                  padding: "10px 24px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}>
                  Set up PIN
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Fund Wallet Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="at-overlay" style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
        }}>
          <div className="at-modal border border-gray-200/10" style={{
            background: "#fff", width: "92%", maxWidth: 380,
            borderRadius: 20, padding: "28px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Fund wallet</p>
                <p className="text-gray-700" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>Minimum deposit ₦100</p>
              </div>
            </div>

            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "8px 12px",
                fontSize: 12, color: "#dc2626", marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <label className="font-bold" style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Amount (₦)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="at-input"
              style={{ marginTop: 6, marginBottom: 20, fontSize: 18, fontWeight: 600 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="at-modal-btn-ghost" onClick={() => { setShowModal(false); setAmount(""); setError(""); }}>
                Cancel
              </button>
              <button className="at-modal-btn-primary" onClick={handleAddMoney} disabled={loadingPay}>
                {loadingPay ? <><span className="at-spin" /> Processing…</> : "Continue to pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Account Details Modal (bank transfer funding) ───────────── */}
      {showVaModal && virtualAccount && (
        <div className="at-overlay" style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
          padding: 16,
        }}>
          <div className="at-modal" style={{
            background: "#fff", width: "100%", maxWidth: 400,
            borderRadius: 22, padding: "22px 20px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>Account details</p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Transfer here anytime to fund your wallet</p>
              </div>
              <button
                onClick={() => setShowVaModal(false)}
                aria-label="Close"
                style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  border: "none", background: "#f1f5f9", color: "#64748b",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="at-va-card">
              <div className="at-va-card-top">
                <div className="at-va-chip">
                  <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                    <rect x="0.5" y="0.5" width="25" height="19" rx="3.5" fill="url(#at-chip-grad)" stroke="rgba(255,255,255,0.35)"/>
                    <line x1="8.5" y1="0.5" x2="8.5" y2="19.5" stroke="rgba(255,255,255,0.3)"/>
                    <line x1="17.5" y1="0.5" x2="17.5" y2="19.5" stroke="rgba(255,255,255,0.3)"/>
                    <line x1="0.5" y1="7" x2="25.5" y2="7" stroke="rgba(255,255,255,0.3)"/>
                    <line x1="0.5" y1="13" x2="25.5" y2="13" stroke="rgba(255,255,255,0.3)"/>
                    <defs>
                      <linearGradient id="at-chip-grad" x1="0" y1="0" x2="26" y2="20">
                        <stop stopColor="#fde68a"/>
                        <stop offset="1" stopColor="#d4a94a"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="at-va-badge">
                  <span className="at-va-dot" />
                  Active
                </span>
              </div>

              <div className="at-va-number-row">
                <div className="at-va-number">
                  {virtualAccount.account_number.match(/.{1,10}/g).map((chunk, i) => (
                    <span key={i} className="at-va-group">{chunk}</span>
                  ))}
                </div>
                <button onClick={handleCopyVirtualAccount} className="at-va-copy" aria-label="Copy account number">
                  {copiedVA ? (
                    <>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="at-va-bottom-row">
                <div>
                  <p className="at-va-label">Account name</p>
                  <p className="at-va-value">{virtualAccount.account_name}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="at-va-label">Bank</p>
                  <p className="at-va-value">{virtualAccount.bank_name}</p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, textAlign: "center" }}>
              Transfers land in your wallet automatically — no need to confirm.
            </p>

            <button className="at-modal-btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setShowVaModal(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Withdraw Modal ────────────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="at-overlay" style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
        }}>
          <div className="at-modal" style={{
            background: "#fff", width: "92%", maxWidth: 400,
            borderRadius: 20, padding: "28px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2">
                  <polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/>
                  <path d="M4 18h16"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Withdraw funds</p>
                <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Transfer to your bank account</p>
              </div>
            </div>

            {withdrawError && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "8px 12px",
                fontSize: 12, color: "#dc2626", marginBottom: 14,
              }}>
                {withdrawError}
              </div>
            )}

            {savedBanks.length > 0 && userPlan !== "free" && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Recent accounts
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                  {savedBanks.map((b, i) => (
                    <div key={i} className="at-saved-bank"
                      onClick={() => { setAccountNumber(b.account_number); setAccountName(b.account_name); setBankCode(b.bank_code); }}>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getFirstTwoNames(b.account_name)}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{maskAccountNumber(b.account_number)}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getFirstName(b.bank_name)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Amount (₦)
                </label>
                <input type="number" value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="at-input"
                  style={{ marginTop: 5, fontSize: 16, fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Account number
                </label>
                <input type="number" value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  className="at-input" style={{ marginTop: 5 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Bank
                </label>
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                  className="at-select" style={{ marginTop: 5 }}>
                  <option value="">Select bank</option>
                  {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Account name
                </label>
                <input type="text" value={accountName}
                  placeholder={gettingAccountName && accountNumber.length === 10 && bankCode ? "Verifying…" : "Auto-filled after verification"}
                  disabled
                  className="at-input" style={{ marginTop: 5 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="at-modal-btn-ghost" onClick={() => {
                fetchAccount(); setShowWithdrawModal(false);
                setAccountNumber(""); setAccountName(""); setGettingAccountName(true);
                setBankCode(""); setWithdrawAmount(""); fetchBanks(); setWithdrawError("");
              }}>
                Cancel
              </button>
              <button className="at-modal-btn-primary" onClick={() => {
                setWithdrawError("");
                if (!withdrawAmount || !accountNumber || !bankCode) { setWithdrawError("Complete all fields"); return; }
                setShowPinConfirm(true);
              }}>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Balance card */}
        <div className="at-card at-balance-card" style={{ borderRadius: 20, padding: "24px 22px 22px" }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.65)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Available balance
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 6vw, 38px)",
            fontWeight: 700,
            color: "#fff",
            margin: "6px 0 20px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            ₦ {formatMoney(balance)}
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="at-btn-add" onClick={() => setShowModal(true)}>
              + Add money
            </button>
            <button className="at-btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
              Withdraw
            </button>
          </div>

          {/* Bank transfer funding — compact strip, opens the full card in a modal */}
          {!loadingVA && !vaUnavailable && virtualAccount && (
            <button className="at-va-strip" onClick={() => setShowVaModal(true)}>
              <span className="at-va-strip-chip">
                <svg width="18" height="14" viewBox="0 0 26 20" fill="none">
                  <rect x="0.5" y="0.5" width="25" height="19" rx="3.5" fill="url(#at-chip-grad-strip)" stroke="rgba(255,255,255,0.35)"/>
                  <line x1="8.5" y1="0.5" x2="8.5" y2="19.5" stroke="rgba(255,255,255,0.3)"/>
                  <line x1="17.5" y1="0.5" x2="17.5" y2="19.5" stroke="rgba(255,255,255,0.3)"/>
                  <line x1="0.5" y1="7" x2="25.5" y2="7" stroke="rgba(255,255,255,0.3)"/>
                  <line x1="0.5" y1="13" x2="25.5" y2="13" stroke="rgba(255,255,255,0.3)"/>
                  <defs>
                    <linearGradient id="at-chip-grad-strip" x1="0" y1="0" x2="26" y2="20">
                      <stop stopColor="#fde68a"/>
                      <stop offset="1" stopColor="#d4a94a"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="at-va-strip-text">
                <span className="at-va-strip-label">Fund by transfer</span>
                <span className="at-va-strip-number">{virtualAccount.account_number}</span>
              </span>
              <span className="at-va-strip-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          )}
        </div>

        {/* Bank transfer activation prompt — only shown before an account exists */}
        {!loadingVA && !vaUnavailable && !virtualAccount && (
          <div className="at-card" style={{ borderRadius: 20, padding: "20px 22px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Bank transfer funding
            </p>
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                Get a personal bank account number for funding your wallet by transfer.
              </p>

              {vaError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 12, color: "#dc2626", marginTop: 10,
                }}>
                  {vaError}
                </div>
              )}

              {vaNeedsPhone && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    className="at-input"
                    style={{ marginTop: 5 }}
                    placeholder="08012345678"
                    value={vaPhone}
                    onChange={(e) => setVaPhone(e.target.value)}
                  />
                </div>
              )}

              <button
                className="at-btn-add"
                style={{ marginTop: 12 }}
                disabled={creatingVA || (vaNeedsPhone && !vaPhone)}
                onClick={handleActivateVirtualAccount}
              >
                {creatingVA ? <><span className="at-spin" /> Setting up…</> : "Activate bank transfer"}
              </button>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="at-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
          <div className="at-stat">
            <p style={{ fontSize: 11.5, fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.02em" }}>Total earned</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 6, letterSpacing: "-0.01em" }}>
              ₦ {formatMoney(
                transactions.filter(t => t.type === "credit" && t.status === "success")
                  .reduce((s, t) => s + Number(t.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="at-stat">
            <p style={{ fontSize: 11.5, fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.02em" }}>Total withdrawn</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 6, letterSpacing: "-0.01em" }}>
              ₦ {formatMoney(
                transactions.filter(t => t.type === "debit" && t.status === "success")
                  .reduce((s, t) => s + Number(t.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="at-stat">
            <p style={{ fontSize: 11.5, fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.02em" }}>Transactions</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginTop: 6 }}>{transactions.length}</p>
          </div>
        </div>

        {/* Transaction history */}
        <div className="at-card at-history">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 20px 14px",
            borderBottom: transactions.length > 0 ? "1px solid #f1f5f9" : "none",
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Transaction history</p>
            <button className="at-view-more"
              onClick={() => setPage(p => p < Math.ceil(transactions.length / ITEMS_PER_PAGE) ? p + 1 : p)}>
              View more →
            </button>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "#f8fafc", margin: "0 auto 14px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: 0 }}>No transactions yet</p>
              <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 4 }}>Fund your wallet to get started</p>
            </div>
          ) : (
            <div style={{ padding: "0 20px" }}>
              {currentTransactions.map((tx) => <TransactionItem key={tx.id} tx={tx} />)}

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0 16px",
                borderTop: "1px solid #f1f5f9",
                marginTop: 4,
              }}>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  Page <span style={{ fontWeight: 600, color: "#475569" }}>{page}</span>{" "}
                  of{" "}
                  <span style={{ fontWeight: 600, color: "#475569" }}>
                    {Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE))}
                  </span>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="at-page-btn"
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    aria-label="Previous page">‹</button>
                  <span style={{
                    minWidth: 28, height: 30,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#2563eb",
                    background: "#eff6ff", borderRadius: 8,
                  }}>{page}</span>
                  <button className="at-page-btn"
                    onClick={() => setPage(p => p < Math.ceil(transactions.length / ITEMS_PER_PAGE) ? p + 1 : p)}
                    disabled={page >= Math.ceil(transactions.length / ITEMS_PER_PAGE)}
                    aria-label="Next page">›</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Upgraded TransactionItem (drop-in, same props) ──────────────────────────
function TransactionItem({ tx }) {
  const isCredit = tx.type === "credit";
  const formatMoney = (value) =>
    new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const statusColor = tx.status === "success" ? "#16a34a" : tx.status === "pending" ? "#d97706" : "#dc2626";
  const statusBg   = tx.status === "success" ? "#f0fdf4" : tx.status === "pending" ? "#fffbeb" : "#fef2f2";
  const statusBorder = tx.status === "success" ? "#bbf7d0" : tx.status === "pending" ? "#fde68a" : "#fecaca";

  return (
    <div className="at-tx-row">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="at-tx-icon" style={{
          background: isCredit ? "#f0fdf4" : "#fef2f2",
        }}>
          {isCredit ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.2">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
            </svg>
          )}
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
            {tx.description}
          </p>
          <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "3px 0 0" }}>
            {new Date(tx.created_at).toLocaleString("en-NG", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 700, margin: 0,
          color: isCredit ? "#16a34a" : "#dc2626",
          letterSpacing: "-0.01em",
        }}>
          {isCredit ? "+" : "−"}₦{formatMoney(Number(tx.amount || 0))}
        </p>
        <span style={{
          display: "inline-block", marginTop: 3,
          fontSize: 10.5, fontWeight: 600,
          color: statusColor, background: statusBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: 20, padding: "2px 7px",
          letterSpacing: "0.02em",
        }}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}

// ─── Upgraded AccountTabSkeleton ─────────────────────────────────────────────
function AccountTabSkeleton() {
  const sk = {
    borderRadius: 8,
    background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
    backgroundSize: "800px 100%",
    animation: "at-skeleton 1.4s ease infinite",
  };

  return (
    <>
      <style>{`
        @keyframes at-skeleton {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Balance card */}
        <div style={{
          background: "linear-gradient(135deg, #1a56db, #1e3a8a)",
          borderRadius: 20, padding: "24px 22px 22px",
        }}>
          <div style={{ ...sk, height: 12, width: 120, background: "rgba(255,255,255,0.15)", marginBottom: 10 }} />
          <div style={{ ...sk, height: 40, width: 180, background: "rgba(255,255,255,0.15)", marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...sk, height: 38, width: 110, borderRadius: 10, background: "rgba(255,255,255,0.15)" }} />
            <div style={{ ...sk, height: 38, width: 100, borderRadius: 10, background: "rgba(255,255,255,0.12)" }} />
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ ...sk, height: 11, width: 70, marginBottom: 10 }} />
              <div style={{ ...sk, height: 18, width: 100 }} />
            </div>
          ))}
        </div>

        {/* History */}
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ ...sk, height: 14, width: 140 }} />
            <div style={{ ...sk, height: 12, width: 70 }} />
          </div>
          <div style={{ padding: "0 20px" }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ ...sk, width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...sk, height: 12, width: "55%", marginBottom: 7 }} />
                  <div style={{ ...sk, height: 10, width: "35%" }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...sk, height: 13, width: 70, marginBottom: 6 }} />
                  <div style={{ ...sk, height: 16, width: 50, borderRadius: 20 }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
              <div style={{ ...sk, height: 11, width: 60 }} />
              <div style={{ display: "flex", gap: 6 }}>
                {[0,1,2].map(i => <div key={i} style={{ ...sk, width: 30, height: 30, borderRadius: 8 }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function Info({ label, value, user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { update } = useSession();

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
      await update({ user: { first_name, surname } });

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

function PasswordTab({ user, load, setGlobalLoading, setUser }) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checks = {
    length: form.newPass.length >= 6,
    number: /\d/.test(form.newPass),
    special: /[^A-Za-z0-9]/.test(form.newPass),
    uppercase: /[A-Z]/.test(form.newPass),
  };

  const { update } = useSession();

  const handleChangePin = async () => {
    if (pinLoading) return;
    setPinError("");
    setPinSuccess("");
    const cleanNewPin = String(pinForm.newPin).trim();
    if (!/^\d{4}$/.test(cleanNewPin))
      return setPinError("PIN must be exactly 4 digits");
    if (pinForm.newPin !== pinForm.confirmPin)
      return setPinError("PINs do not match");
    if (user?.pin_set && !pinForm.currentPin)
      return setPinError("Current PIN is required");
    setGlobalLoading(true);
    // setLoading(true);
    setPinLoading(true);
    try {
      const res = await fetch("/api/user/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      await update({ user: { pin_set: true } });
      setUser((prev) => ({ ...prev, pin_set: true }));
      setPinSuccess("PIN updated successfully");
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (err) {
      console.error(err);
      setPinError("Error updating PIN");
    } finally {
      setPinLoading(false);
      setGlobalLoading(false);
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (loading) return;
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

    setGlobalLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: form.current,
          newPassword: form.newPass,
        }),
      });
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
      setGlobalLoading(false);
    }
  };

  if (load || loading) return <PasswordTabSkeleton />;

  return (
    <div className="space-y-4">
      {/* ── PIN Section ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-transparent">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Lock size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {user?.pin_set ? "Change transaction PIN" : "Set transaction PIN"}
            </h2>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {user?.pin_set
                ? "Enter your current PIN to update it"
                : "Create a 4-digit PIN for secure actions"}
            </p>
          </div>
          {user?.pin_set && (
            <span className="ml-auto flex items-center gap-1 text-[10.5px] font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </span>
          )}
        </div>

        <div className="px-5 py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePin();
            }}
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {user?.pin_set && (
                <PinField
                  label="Current PIN"
                  value={pinForm.currentPin}
                  onChange={(val) =>
                    setPinForm({ ...pinForm, currentPin: val })
                  }
                />
              )}
              <PinField
                label="New PIN"
                value={pinForm.newPin}
                onChange={(val) => setPinForm({ ...pinForm, newPin: val })}
              />
              <PinField
                label="Confirm PIN"
                value={pinForm.confirmPin}
                onChange={(val) => setPinForm({ ...pinForm, confirmPin: val })}
              />
            </div>

            {/* Feedback */}
            {(pinError || pinSuccess) && (
              <div
                className={`mt-4 flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border animate-fadeIn
                ${
                  pinError
                    ? "text-red-700 bg-red-50 border-red-100"
                    : "text-green-700 bg-green-50 border-green-100"
                }`}
              >
                <span className="text-base">{pinError ? "⚠" : "✓"}</span>
                {pinError || pinSuccess}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                disabled={pinLoading}
                type="submit"
                className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
                  text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-150
                  disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200`}
              >
                {pinLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    {user?.pin_set ? "Update PIN" : "Set PIN"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Password Section ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-transparent">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Change password
            </h2>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              Enter your current password to set a new one
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <PasswordInput
                label="Current password"
                value={form.current}
                onChange={(v) => setForm({ ...form, current: v })}
                show={show.current}
                toggle={() => setShow({ ...show, current: !show.current })}
                disabled={loading}
              />
              <PasswordInput
                label="New password"
                value={form.newPass}
                onChange={(v) => setForm({ ...form, newPass: v })}
                show={show.newPass}
                toggle={() => setShow({ ...show, newPass: !show.newPass })}
                disabled={loading}
              />
              <PasswordInput
                label="Confirm password"
                value={form.confirm}
                onChange={(v) => setForm({ ...form, confirm: v })}
                show={show.confirm}
                toggle={() => setShow({ ...show, confirm: !show.confirm })}
                disabled={loading}
              />
            </div>

            {/* Feedback */}
            {(error || correct) && (
              <div
                className={`mt-4 flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border animate-fadeIn
                ${
                  error
                    ? "text-red-700 bg-red-50 border-red-100"
                    : "text-green-700 bg-green-50 border-green-100"
                }`}
              >
                <span className="text-base">{error ? "⚠" : "✓"}</span>
                {error || correct}
              </div>
            )}

            {/* Strength checklist */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
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

            <div className="mt-5 flex justify-end">
              <button
                disabled={loading}
                type="submit"
                className={`inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]
                  text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-150
                  disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-indigo-200`}
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    Update password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components (visual upgrades only) ──

function PinField({ label, value, onChange }) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
        {label}
      </p>
      <PinInput value={value} onChange={onChange} />
    </div>
  );
}

// PinInput — identical logic, refreshed look
function PinInput({ value = "", onChange }) {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const newValue = value.split("");
    newValue[index] = val[0];
    const final = newValue.join("").slice(0, 4);
    onChange(final);
    if (index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!value[index]) inputs.current[index - 1]?.focus();
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
      if (inputs.current[i]) inputs.current[i].value = char;
    });
  };

  return (
    <div className="flex gap-2.5" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="number"
          maxLength={1}
          ref={(el) => (inputs.current[i] = el)}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-11 h-12 text-center text-lg font-semibold text-gray-900
            border border-gray-200 rounded-xl bg-gray-50
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white
            outline-none transition-all duration-150
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ))}
    </div>
  );
}

// PasswordInput — identical logic, refreshed look
function PasswordInput({ label, value, onChange, show, toggle, disabled }) {
  return (
    <div>
      <label className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      <div
        className={`flex items-center border rounded-xl px-3 gap-2 transition-all duration-150
        ${disabled ? "bg-gray-50 opacity-60" : "bg-white"}
        focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 border-gray-200`}
      >
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          disabled={disabled}
          className="flex-1 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={toggle}
          className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// CheckItem — refined with smooth color transition
function CheckItem({ valid, text }) {
  return (
    <p
      className={`flex items-center gap-2 text-xs transition-colors duration-300
      ${valid ? "text-green-600" : "text-gray-400"}`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] transition-all duration-300
        ${valid ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
      >
        {valid ? "✓" : "○"}
      </span>
      {text}
    </p>
  );
}

// PasswordTabSkeleton — unchanged structure, slightly softer
function PasswordTabSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((s) => (
        <div
          key={s}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="h-2.5 w-48 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(s === 0 ? 3 : 3)].map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-20 rounded bg-gray-200 animate-pulse mb-2.5" />
                  {s === 0 ? (
                    <div className="flex gap-2.5">
                      {[...Array(4)].map((_, j) => (
                        <div
                          key={j}
                          className="w-11 h-12 rounded-xl bg-gray-200 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-11 rounded-xl bg-gray-200 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <div className="h-10 w-32 rounded-xl bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LInkedTab() {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!imgLoaded) {
    return (
      <>
        <LinkedTabSkeleton />

        <img
          src="/security-shield.png"
          alt=""
          className="hidden"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)} // don't get stuck if image fails
        />
      </>
    );
  }
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
function LinkedTabSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-2" />
          <div className="h-3 w-60 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Google card */}
        <div className="flex items-center my-7 justify-between border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3.5 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-36 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-22 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Security status */}
      <div className="flex items-center border-t pt-4">
        <div className="h-3.5 w-40 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Shield placeholder */}
      <div className="flex justify-center">
        <div className="w-44 h-52 rounded-2xl bg-gray-200 animate-pulse" />
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
          <Link
            href={`/terms-of-service`}
            className="text-blue-600 font-semibold"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href={`/privacy-policy`}
            className="text-blue-600 font-semibold"
          >
            Privacy Policy
          </Link>{" "}
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
          <Link href={`/terms-of-service`}>
            <button
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0000FF] text-white text-sm font-medium
        hover:opacity-90 transition active:scale-[0.98]"
            >
              Terms of service
            </button>
          </Link>
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
          <Link href={`/privacy-policy`}>
            <button
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0000FF] text-white text-sm font-medium
        hover:opacity-90 transition active:scale-[0.98]"
            >
              Privacy Policy
            </button>
          </Link>
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