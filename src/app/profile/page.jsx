"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Loader from "@/components/Loader";

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("");
  const [globalLoading, setGlobalLoading] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("nepo-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <h1 className="text-blue-600 text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Account Settings
      </h1>

      {/* Mobile Tabs */}
      <div className="flex md:hidden overflow-x-auto gap-2 mb-4 ">
        <MobileTab
          label="Profile"
          active={activeTab === "profile"}
          onClick={() => !globalLoading && setActiveTab("profile")}
        />
        <MobileTab
          label="Password"
          active={activeTab === "password"}
          onClick={() => !globalLoading && setActiveTab("password")}
        />
        <MobileTab
          label="Linked Account"
          active={activeTab === "linked"}
          onClick={() => !globalLoading && setActiveTab("linked")}
        />
        <MobileTab
          label="Data & Privacy "
          active={activeTab === "data"}
          onClick={() => !globalLoading && setActiveTab("data")}
        />
        <MobileTab
          label="Notifications"
          active={activeTab === "notifications"}
          onClick={() => !globalLoading && setActiveTab("notifications")}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden h-fit md:block bg-white shadow rounded-xl p-4 w-60">
          <TabButton
            icon={<User size={16} />}
            label="Profile Information"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Lock size={16} />}
            label="Change Password"
            active={activeTab === "password"}
            onClick={() => setActiveTab("password")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Link size={16} />}
            label="Linked Account"
            active={activeTab === "linked"}
            onClick={() => setActiveTab("linked")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Shield size={16} />}
            label="Data & Privacy"
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
            disabled={globalLoading}
          />
          <TabButton
            icon={<Bell size={16} />}
            label="Notifications"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            disabled={globalLoading}
          />
        </div>

        {/* Content */}
        <div
          className={`flex-1 ${
            globalLoading ? "pointer-events-none opacity-80" : ""
          }`}
        >
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "password" && (
            <PasswordTab setGlobalLoading={setGlobalLoading} />
          )}
          {activeTab === "linked" && <LInkedTab />}
          {activeTab === "data" && <DataTab />}
          {activeTab === "notifications" && <NotificationTab />}
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
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("nepo-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);
  if (loading) {
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
function PasswordTab({ setGlobalLoading }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const checks = {
    length: form.newPass.length >= 6,
    number: /\d/.test(form.newPass),
    special: /[^A-Za-z0-9]/.test(form.newPass),
    uppercase: /[A-Z]/.test(form.newPass),
  };
  const [correct, setCorrect] = useState("");
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("nepo-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
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

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1">
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
                Updating...
              </>
            ) : (
              <>
                <Lock size={16} /> Update password
              </>
            )}
          </button>
        </div>
      </form>
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
