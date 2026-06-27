"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const gameData = {
  "Blood Strike": "bloodstrike-ac.png",
  "Call of Duty": "call-of-duty.png",
  "Delta Force": "delta.png",
  DLS: "dls.png",
  "EA Sports": "fifa.png",
  Efootball: "efootball.png",
  "Free Fire": "freefire-ac.png",
  PubG: "pubg.png",
};

export default function SellGame() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return;
        }
        const user = await res.json();
        if (!user.phone_verified) {
          router.replace("/seller");
        }
      } catch (err) {
        router.replace("/login");
      }
    };
    checkUser();
  }, [router]);

  const [selectedGame, setSelectedGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("idle");
  const [timer, setTimer] = useState(10);
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          setUser(null);
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("tournament_return_url", currentPath);
          router.push("/login");
          return;
        }
        if (!res.ok) {
          console.error("Server error:", res.status);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Network error:", err);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 5) {
      alert("You can only upload 5 images.");
      return;
    }
    const tempId = Date.now();
    const newImage = {
      id: tempId,
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    };
    setImages((prev) => [...prev, newImage]);
    setTimeout(() => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId ? { ...img, uploading: false } : img
        )
      );
    }, 1500);
    e.target.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const isLocked = step === "submitting";

  const handleClick = (e) => {
    e.preventDefault();
    if (step === "idle") {
      setStep("confirming");
      setTimer(10);
      const id = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            setStep("ready");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }
    if (step === "ready") {
      setStep("submitting");
      if (!user?.id) {
        alert("You are not logged in");
        setStep("ready");
        return;
      }
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("title", selectedGame);
      formData.append("description", description);
      formData.append("price", amount);
      formData.append("platform", platform);
      formData.append("cover_image", gameData[selectedGame]);
      images.forEach((img) => {
        formData.append("images", img.file);
      });
      fetch("/api/listings", {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                `Request failed with ${res.status}`
            );
          }
          setSlug(data.listing.slug);
          return data;
        })
        .then((data) => {
          setSuccess(true);
          setImages([]);
          setSelectedGame("");
          setPlatform("");
          setDescription("");
          setAmount("");
          setStep("idle");
          setTimer(10);
        })
        .catch((err) => {
          console.error(err);
          alert("Something broke");
          setStep("ready");
        });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .sell-page * {
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }

        .sell-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%);
          padding: 40px 16px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .page-header {
          text-align: center;
          margin-bottom: 36px;
          animation: fadeSlideDown 0.5s ease both;
        }

        .page-header-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EEF2FF;
          color: #4F46E5;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 14px;
          border: 1px solid #C7D2FE;
        }

        .page-header h1 {
          font-size: clamp(24px, 5vw, 34px);
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }

        .page-header p {
          font-size: 15px;
          color: #64748B;
          margin: 0;
          max-width: 440px;
        }

        .main-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px rgba(99,102,241,0.08);
          width: 100%;
          max-width: 680px;
          padding: 40px;
          animation: fadeSlideUp 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .main-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
        }

        .fee-notice {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
          border: 1px solid #A7F3D0;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 28px;
        }

        .fee-notice-icon {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #D1FAE5;
          border: 1px solid #6EE7B7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .fee-notice-title {
          font-size: 13px;
          font-weight: 700;
          color: #065F46;
          margin: 0 0 3px;
          letter-spacing: 0.01em;
        }

        .fee-notice-body {
          font-size: 13px;
          color: #047857;
          margin: 0;
          line-height: 1.5;
        }

        .image-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #92400E;
          line-height: 1.5;
        }

        .image-warning svg {
          flex-shrink: 0;
          color: #F59E0B;
        }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #F1F5F9;
        }

        .upload-zone {
          background: #F8FAFF;
          border: 2px dashed #C7D2FE;
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .upload-zone:hover {
          border-color: #818CF8;
          background: #EEF2FF;
        }

        .upload-zone.is-locked {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .upload-zone.is-full {
          border-color: #BBF7D0;
          background: #F0FDF4;
          cursor: default;
        }

        .upload-zone input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .upload-icon-wrap {
          width: 52px;
          height: 52px;
          background: #EEF2FF;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border: 1px solid #C7D2FE;
        }

        .upload-label-main {
          font-size: 14px;
          font-weight: 600;
          color: #3730A3;
          margin-bottom: 4px;
        }

        .upload-label-sub {
          font-size: 12px;
          color: #94A3B8;
        }

        .upload-progress {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: 14px;
        }

        .upload-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #C7D2FE;
          transition: all 0.3s ease;
        }

        .upload-dot.filled {
          background: #4F46E5;
          transform: scale(1.15);
        }

        .image-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .image-thumb {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #E2E8F0;
          transition: border-color 0.2s;
        }

        .image-thumb:hover {
          border-color: #818CF8;
        }

        .image-thumb img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          display: block;
        }

        @media (min-width: 640px) {
          .image-thumb img {
            width: 96px;
            height: 96px;
          }
        }

        .image-thumb .spinner-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-thumb .remove-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(15,23,42,0.75);
          color: #fff;
          border: none;
          border-radius: 6px;
          width: 22px;
          height: 22px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .image-thumb:hover .remove-btn {
          opacity: 1;
        }

        .form-section {
          margin-bottom: 28px;
        }

        .field-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 540px) {
          .field-group {
            grid-template-columns: 1fr;
          }
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .field .helper {
          font-size: 11.5px;
          color: #94A3B8;
          margin-top: -3px;
        }

        .field select,
        .field input[type="number"],
        .field textarea {
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #0F172A;
          background: #FAFAFA;
          transition: all 0.2s ease;
          outline: none;
          appearance: none;
          width: 100%;
        }

        .field select:focus,
        .field input[type="number"]:focus,
        .field textarea:focus {
          border-color: #6366F1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .field select:disabled,
        .field input:disabled,
        .field textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field textarea {
          resize: none;
          min-height: 110px;
          line-height: 1.6;
        }

        .price-wrap {
          position: relative;
        }

        .price-wrap .currency {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #6B7280;
          font-size: 15px;
          font-weight: 500;
          pointer-events: none;
        }

        .price-wrap input {
          padding-left: 30px !important;
        }

        .select-wrap {
          position: relative;
        }

        .select-wrap::after {
          content: '';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #94A3B8;
          pointer-events: none;
        }

        .divider {
          height: 1px;
          background: #F1F5F9;
          margin: 0 0 28px;
        }

        .cta-section {
          padding-top: 4px;
        }

        .submit-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }

        .submit-btn.idle {
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          box-shadow: 0 4px 14px rgba(99,102,241,0.4), 0 1px 3px rgba(0,0,0,0.1);
        }

        .submit-btn.idle:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(99,102,241,0.45), 0 2px 6px rgba(0,0,0,0.1);
        }

        .submit-btn.idle:active {
          transform: translateY(0);
          box-shadow: 0 4px 10px rgba(99,102,241,0.35);
        }

        .submit-btn.confirming {
          background: #6B7280;
          cursor: not-allowed;
          opacity: 0.85;
        }

        .submit-btn.ready {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          box-shadow: 0 4px 14px rgba(16,185,129,0.4);
        }

        .submit-btn.ready:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(16,185,129,0.45);
        }

        .submit-btn.submitting {
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          opacity: 0.8;
          cursor: not-allowed;
        }

        .submit-btn:disabled {
          transform: none !important;
        }

        .spin {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .timer-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.25);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 13px;
          font-weight: 700;
          min-width: 42px;
        }

        .trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
        }

        .success-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 0 8px;
          animation: fadeSlideUp 0.4s ease both;
        }

        .success-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          margin-bottom: 20px;
          border: 2px solid #6EE7B7;
        }

        .success-card h2 {
          font-size: 22px;
          font-weight: 700;
          color: #065F46;
          margin: 0 0 10px;
        }

        .success-card p {
          font-size: 14px;
          color: #6B7280;
          max-width: 320px;
          line-height: 1.6;
          margin: 0 0 28px;
        }

        .success-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-primary {
          padding: 11px 22px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4F46E5, #6366F1);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99,102,241,0.4);
        }

        .btn-secondary {
          padding: 11px 22px;
          border-radius: 12px;
          background: #fff;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          border: 1.5px solid #E2E8F0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sell-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-eyebrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#4F46E5" strokeWidth="1.5"/>
              <path d="M6 4v3M6 8.5v.5" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Seller Dashboard
          </div>
          <h1>List Your Gaming Account</h1>
          <p>Reach thousands of verified buyers. Secure escrow on every trade.</p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {!success ? (
            <form onSubmit={handleClick}>

              {/* Seller Fee Notice */}
              <div className="fee-notice">
                <div className="fee-notice-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5a.75.75 0 110 1.5A.75.75 0 018 5zm-.75 2.75h1.5v4h-1.5v-4z" fill="#059669"/>
                  </svg>
                </div>
                <div>
                  <p className="fee-notice-title">Seller Fee</p>
                  <p className="fee-notice-body">
                    A 5% service charge will only be deducted after your account has been traded successfully. No upfront listing fee.
                  </p>
                </div>
              </div>

              {/* Upload Section */}
              <div className="form-section">
                <p className="section-label">Account Screenshots</p>

                {images.length > 0 && (
                  <div className="image-grid">
                    {images.map((img, index) => (
                      <div key={img.id} className="image-thumb">
                        <img
                          src={img.preview}
                          alt={`preview-${index}`}
                          style={{ opacity: img.uploading ? 0.45 : 1 }}
                        />
                        {img.uploading && (
                          <div className="spinner-overlay">
                            <div className="spin" style={{ borderColor: "rgba(99,102,241,0.25)", borderTopColor: "#6366F1" }}></div>
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={isLocked || img.uploading}
                          onClick={() => removeImage(img.id)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 5 && !isLocked && (
                  <label>
                    <div className="upload-zone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      required={images.length === 0}
                      disabled={isLocked}
                    />
                    
                    <div className="upload-icon-wrap">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15V3m0 0l-4 4m4-4l4 4" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="upload-label-main">Click to upload images</p>
                    <p className="upload-label-sub">PNG, JPG less than 10MB each</p>
                    <div className="upload-progress">
                      {[0,1,2,3,4].map(i => (
                        <div key={i} className={`upload-dot ${i < images.length ? "filled" : ""}`} />
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>
                      {images.length}/5 uploaded
                    </p></div>
                  </label>
                )}

                {images.length < 5 && (
                  <div className="image-warning">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5h1.5v4.5h-1.5V5zm0 5.5h1.5V12h-1.5v-1.5z" fill="#F59E0B"/>
                    </svg>
                    <p>
                    Upload exactly <strong style={{ margin: "0 3px" }}>5 screenshots</strong> showing account details. Don't include passwords or sensitive info.
                  </p></div>
                )}

                {images.length === 5 && isLocked && (
                  <div className="upload-zone is-full" style={{ padding: "14px 20px", marginBottom: 0, textAlign: "center" }}>
                    <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>✓ 5 images ready</span>
                  </div>
                )}
              </div>

              <div className="divider" />

              {/* Game Details Section */}
              <div className="form-section">
                <p className="section-label">Game Details</p>

                <div className="field-group">
                  <div className="field">
                    <label>Game</label>
                    <div className="select-wrap">
                      <select
                        value={selectedGame}
                        required
                        disabled={isLocked}
                        onChange={(e) => setSelectedGame(e.target.value)}
                      >
                        <option value="">Select a game</option>
                        {Object.keys(gameData).map((game) => (
                          <option key={game} value={game}>{game}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Platform</label>
                    <div className="select-wrap">
                      <select
                        value={platform}
                        required
                        disabled={isLocked}
                        onChange={(e) => setPlatform(e.target.value)}
                      >
                        <option value="">Select platform</option>
                        <option value="mobile">Mobile</option>
                        <option value="pc">PC</option>
                        <option value="xbox">Xbox</option>
                        <option value="playstation">PlayStation</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                  <label>Price</label>
                  <p className="helper">Set a fair price to attract more buyers</p>
                  <div className="price-wrap">
                    <span className="currency">₦</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Account Description</label>
                  <p className="helper">Include rank, skins, in-game currency, achievements, etc.</p>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLocked}
                    placeholder="e.g. Diamond rank, 50+ skins, 10,000 V-bucks, Season 8 battle pass..."
                  />
                </div>
              </div>

              <div className="divider" />

              {/* CTA */}
              <div className="cta-section">
                <button
                  type="submit"
                  disabled={step === "confirming" || step === "submitting"}
                  className={`submit-btn ${step}`}
                >
                  {step === "idle" && (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      List My Account
                    </>
                  )}
                  {step === "confirming" && (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Reviewing details…
                      <span className="timer-badge">{timer}s</span>
                    </>
                  )}
                  {step === "ready" && (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Confirm & List Account
                    </>
                  )}
                  {step === "submitting" && (
                    <>
                      <div className="spin"></div>
                      Publishing listing…
                    </>
                  )}
                </button>

                <div className="trust-row">
                  <span className="trust-item">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L2 3.5v5C2 12 5 14.5 8 15c3-0.5 6-3 6-6.5v-5L8 1z" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Escrow Protected
                  </span>
                  <span className="trust-item">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#94A3B8" strokeWidth="1.3"/><path d="M5.5 8l2 2 3-3" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    No Upfront Fees
                  </span>
                  {/* <span className="trust-item">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2a3 3 0 100 6 3 3 0 000-6zm-5 10a5 5 0 0110 0H3z" fill="#94A3B8"/></svg>
                    Verified Buyers Only
                  </span> */}
                </div>
              </div>

            </form>
          ) : (
            <div className="success-card">
              <div className="success-icon">🎉</div>
              <h2>Account Listed Successfully!</h2>
              <p>
                Your gaming account is now live. Verified buyers can find and purchase it. You'll be notified when there's interest.
              </p>
              <div className="success-btns">
                <button
                  className="btn-primary"
                  onClick={() => {
                    window.location.href = `/game/${slug}`;
                  }}
                >
                  View Listing
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSuccess(false);
                    setSlug("");
                  }}
                >
                  List Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}