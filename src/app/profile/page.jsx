"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Upload, Lock, User, Shield, Bell } from "lucide-react";

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored) setUser(stored);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <h1 className="text-blue-600 text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Account Settings
      </h1>

      {/* Mobile Tabs */}
      <div className="flex sm:hidden  overflow-x-auto gap-2 mb-4">
        <MobileTab label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        <MobileTab label="Password" active={activeTab === "password"} onClick={() => setActiveTab("password")} />
        <MobileTab label="Security" active={activeTab === "security"} onClick={() => setActiveTab("security")} />
        <MobileTab label="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden h-fit sm:block bg-white shadow rounded-xl p-4 w-60">
          <TabButton icon={<User size={16} />} label="Profile Information" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          <TabButton icon={<Lock size={16} />} label="Change Password" active={activeTab === "password"} onClick={() => setActiveTab("password")} />
          <TabButton icon={<Shield size={16} />} label="Security" active={activeTab === "security"} onClick={() => setActiveTab("security")} />
          <TabButton icon={<Bell size={16} />} label="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "password" && <PasswordTab />}
          {activeTab === "security" && <SecurityTab />}
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
      className={`px-2 py-1  text-xs whitespace-nowrap ${active ? "bg-blue-600 text-white" : "bg-white border"}`}
    >
      {label}
    </button>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md mb-2 text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileTab({ user }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 border border-blue-400">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="relative mx-auto sm:mx-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-200" />
          <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white">
            <Upload size={12} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <Upload size={14} /> Upload Photo
          </button>
          <button className="border px-4 py-2 rounded-md text-sm">Remove</button>
        </div>
      </div>

      <hr className="my-4 sm:my-6 border-blue-400" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Info label="Full Name" value={user?.name || "No name"} />
        <Info label="User Name" value={user?.username || "@username"} />
        <Info label="E-Mail" value={user?.email || "email@example.com"} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-blue-600 font-medium text-sm">{label}</p>
      <p className="text-gray-600 text-sm sm:text-base">{value}</p>
    </div>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (form.newPass !== form.confirm) return setError("Passwords do not match");
    if (form.newPass.length < 8) return setError("Password too short");

    setError("");
    alert("Password updated (mock)");
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1">Change Password</h2>
      <p className="text-gray-500 text-sm mb-4 sm:mb-6">Enter your current password to change your password</p>

      <PasswordInput label="Current Password" value={form.current} onChange={(v) => setForm({ ...form, current: v })} show={show.current} toggle={() => setShow({ ...show, current: !show.current })} />
      <PasswordInput label="New Password" value={form.newPass} onChange={(v) => setForm({ ...form, newPass: v })} show={show.newPass} toggle={() => setShow({ ...show, newPass: !show.newPass })} />
      <PasswordInput label="Confirm Password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} show={show.confirm} toggle={() => setShow({ ...show, confirm: !show.confirm })} />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="text-xs sm:text-sm mt-4 text-gray-600 space-y-1">
        <p>✔ At least 8 characters</p>
        <p>✔ Contains a number</p>
        <p>✔ Contains a special character</p>
        <p>✔ Contains an uppercase letter</p>
      </div>

      <div className="mt-6 flex justify-center sm:justify-end">
        <button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded-md flex justify-center items-center gap-2">
          <Lock size={16} /> Update password
        </button>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, toggle }) {
  return (
    <div className="mb-3 sm:mb-4">
      <label className="text-blue-600 text-xs sm:text-sm">{label}</label>
      <div className="flex items-center border rounded-md px-3 mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password"
          className="flex-1 py-2 text-sm outline-none"
        />
        <button onClick={toggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">Security Settings</h2>
      <Toggle label="Two-Factor Authentication" storageKey="2fa" />
      <Toggle label="Login Alerts" storageKey="alerts" />
      <Toggle label="Remember Devices" storageKey="devices" />
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
