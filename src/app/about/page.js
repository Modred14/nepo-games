"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Footer from "../footer";
import Reveal from "../reveal";
import LaunchCountdown from "@/components/LaunchCountdown";
import WaitlistOrMarketplace from "@/components/WaitlistOrMarketplace";

export default function AboutPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f7f5f2; }

        .about-root {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          color: #1a1814;
          background: #f7f5f2;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .about-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2.5rem;
          background: rgba(247,245,242,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(26,24,20,0.08);
        }

        .nav-logo {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          color: #1a1814;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .nav-logo span { color: #1b4dff; }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
        }

        .nav-links a {
          font-size: 0.875rem;
          font-weight: 500;
          color: #555;
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-links a:hover { color: #1a1814; }

        .nav-cta {
          background: #1a1814;
          color: #f7f5f2 !important;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }

        .nav-cta:hover {
          background: #1b4dff;
          color: #fff !important;
          transform: translateY(-1px);
        }

        .hero {
          padding: 8rem 2.5rem 5rem;
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-eyebrow {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #1b4dff;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-eyebrow::before {
          content: '';
          display: inline-block;
          width: 24px; height: 2px;
          background: #1b4dff;
          border-radius: 2px;
        }

        .hero-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: clamp(2.8rem, 5vw, 4rem);
          font-weight: 800;
          line-height: 1.06;
          letter-spacing: -2px;
          color: #1a1814;
          margin-bottom: 1.5rem;
        }

        .hero-title em {
          font-style: italic;
          color: #1b4dff;
        }

        .hero-body {
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #555;
          font-weight: 300;
          max-width: 480px;
        }

        .hero-visual {
          position: relative;
          height: 420px;
        }

        .hero-card {
          position: absolute;
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(26,24,20,0.08);
          padding: 1.5rem;
          box-shadow: 0 4px 40px rgba(26,24,20,0.06);
        }

        .hero-card-main {
          top: 0; left: 0; right: 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hc-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: #e8edff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .hc-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 0.9375rem;
          color: #1a1814;
          margin-bottom: 0.2rem;
        }

        .hc-sub {
          font-size: 0.8rem;
          color: #888;
          font-weight: 300;
        }

        .hero-card-stat {
          bottom: 0; right: 0;
          width: 60%;
          text-align: center;
        }

        .stat-number {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #1b4dff;
          letter-spacing: -1px;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #888;
          margin-top: 0.25rem;
          font-weight: 300;
        }

        .hero-card-badge {
          bottom: 80px; left: -20px;
          width: 200px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
        }

        .badge-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.15);
          animation: greenPulse 2s infinite;
        }

        @keyframes greenPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.08); }
        }

        .badge-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1a1814;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(26,24,20,0.12), transparent);
          margin: 0 2.5rem;
        }

        .section {
          padding: 5rem 2.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-eyebrow {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #1b4dff;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-eyebrow::before {
          content: '';
          display: inline-block;
          width: 24px; height: 2px;
          background: #1b4dff;
          border-radius: 2px;
        }

        .section-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.1;
          color: #1a1814;
          margin-bottom: 1.5rem;
        }

        .section-body {
          font-size: 1rem;
          line-height: 1.8;
          color: #555;
          font-weight: 300;
          max-width: 640px;
        }

        .problem-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          margin-top: 3rem;
        }

        .problem-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .pstat {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(26,24,20,0.07);
          padding: 1.5rem;
        }

        .pstat-number {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #e63946;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 0.4rem;
        }

        .pstat-label {
          font-size: 0.8125rem;
          color: #888;
          font-weight: 300;
          line-height: 1.4;
        }

        .pstat-large {
          grid-column: 1 / -1;
          background: #1a1814;
          border-color: transparent;
        }

        .pstat-large .pstat-number { color: #fff; font-size: 2.5rem; }
        .pstat-large .pstat-label { color: rgba(255,255,255,0.5); }

        .solution-bg {
          background: #1a1814;
          color: #f7f5f2;
          padding: 5rem 2.5rem;
        }

        .solution-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .solution-bg .section-eyebrow { color: #6b87ff; }
        .solution-bg .section-eyebrow::before { background: #6b87ff; }
        .solution-bg .section-title { color: #f7f5f2; }
        .solution-bg .section-body { color: rgba(247,245,242,0.6); }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .feature-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.75rem;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }

        .feature-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(107,135,255,0.3);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 44px; height: 44px;
          background: rgba(107,135,255,0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .feature-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: #f7f5f2;
          margin-bottom: 0.6rem;
          letter-spacing: -0.3px;
        }

        .feature-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: rgba(247,245,242,0.5);
          font-weight: 300;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 3rem;
          max-width: 720px;
        }

        .step-item {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 1.5rem;
          padding-bottom: 2.5rem;
          position: relative;
        }

        .step-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 27px; top: 56px; bottom: 0;
          width: 1px;
          background: rgba(26,24,20,0.1);
        }

        .step-number {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid rgba(26,24,20,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: #1b4dff;
          flex-shrink: 0;
        }

        .step-content { padding-top: 0.85rem; }

        .step-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 1.0625rem;
          color: #1a1814;
          margin-bottom: 0.4rem;
          letter-spacing: -0.3px;
        }

        .step-desc {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #777;
          font-weight: 300;
        }

        .founders-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 3rem;
          max-width: 700px;
        }

        .founder-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(26,24,20,0.07);
          padding: 2rem;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .founder-card:hover {
          box-shadow: 0 8px 40px rgba(26,24,20,0.08);
          transform: translateY(-2px);
        }

        .founder-avatar {
          width: 64px; height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 800;
          font-size: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .avatar-blue { background: #e8edff; color: #1b4dff; }
        .avatar-dark { background: #1a1814; color: #f7f5f2; }

        .founder-name {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 1.0625rem;
          color: #1a1814;
          letter-spacing: -0.3px;
          margin-bottom: 0.25rem;
        }

        .founder-role {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1b4dff;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .founder-bio {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #777;
          font-weight: 300;
        }

        .mission-banner {
          background: #1b4dff;
          border-radius: 24px;
          padding: 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin: 2rem 0;
        }

        .mission-banner::before {
          content: '';
          position: absolute;
          top: -60%; left: -20%;
          width: 60%; height: 200%;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
          transform: rotate(-15deg);
        }

        .mission-banner::after {
          content: '';
          position: absolute;
          bottom: -40%; right: -10%;
          width: 40%; height: 150%;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
        }

        .mission-quote {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
          max-width: 640px;
          margin: 0 auto 1.5rem;
        }

        .mission-sub {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.65);
          font-weight: 300;
          position: relative;
          z-index: 1;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 3rem;
        }

        .trust-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(26,24,20,0.07);
          transition: transform 0.2s;
        }

        .trust-item:hover { transform: translateY(-2px); }

        .trust-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .trust-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 0.9375rem;
          color: #1a1814;
          margin-bottom: 0.35rem;
          letter-spacing: -0.3px;
        }

        .trust-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          color: #777;
          font-weight: 300;
        }

        .cta-section {
          padding: 5rem 2.5rem;
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: -1.5px;
          color: #1a1814;
          line-height: 1.1;
          margin-bottom: 1.25rem;
        }

        .cta-sub {
          font-size: 1rem;
          color: #777;
          font-weight: 300;
          margin-bottom: 2.5rem;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #1a1814;
          color: #f7f5f2;
          padding: 0.875rem 2rem;
          border-radius: 100px;
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary:hover {
          background: #1b4dff;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: #1a1814;
          padding: 0.875rem 2rem;
          border-radius: 100px;
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          border: 1px solid rgba(26,24,20,0.2);
          transition: border-color 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover {
          border-color: #1a1814;
          transform: translateY(-1px);
        }

        .about-footer {
          border-top: 1px solid rgba(26,24,20,0.08);
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          margin: 0 auto;
        }

        .footer-logo {
          font-family: "Poppins", Arial, Helvetica, sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: #1a1814;
          text-decoration: none;
        }

        .footer-logo span { color: #1b4dff; }

        .footer-copy {
          font-size: 0.8125rem;
          color: #aaa;
          font-weight: 300;
        }

        /* ── COUNTDOWN ── */
        .cd-wrap {
          font-family: 'Poppins', Arial, Helvetica, sans-serif;
          padding: clamp(2.5rem, 8vw, 5rem) clamp(0.75rem, 4vw, 2.5rem);
          text-align: center;
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
        }

        .cd-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #eff4ff;
          color: #1b4dff;
          font-size: clamp(0.55rem, 2vw, 0.7rem);
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: clamp(4px, 1.5vw, 6px) clamp(10px, 3vw, 16px);
          border-radius: 999px;
          margin-bottom: clamp(1rem, 3vw, 1.75rem);
          border: 1px solid #c7d7fe;
          white-space: nowrap;
        }

        .cd-badge-dot {
          width: 6px; height: 6px;
          min-width: 6px;
          background: #1b4dff;
          border-radius: 50%;
          animation: cdPulse 1.8s ease-in-out infinite;
        }

        @keyframes cdPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .cd-heading {
          font-size: clamp(1.5rem, 7vw, 3.25rem);
          font-weight: 900;
          color: #1a1814;
          letter-spacing: clamp(-1px, -0.04em, -2px);
          line-height: 1.05;
          margin: 0 0 clamp(0.5rem, 2vw, 1rem);
          word-break: break-word;
        }

        .cd-heading span { color: #1b4dff; }

        .cd-sub {
          font-size: clamp(0.78rem, 2.5vw, 0.9375rem);
          color: #777;
          font-weight: 300;
          line-height: 1.6;
          margin: 0 0 clamp(1.5rem, 5vw, 3rem);
          padding: 0 clamp(0px, 2vw, 1rem);
        }

        .cd-sub strong {
          color: #1a1814;
          font-weight: 700;
        }

        .cd-grid {
          display: inline-flex;
          align-items: center;
          gap: clamp(4px, 2vw, 12px);
          background: #f4f7ff;
          border: 1px solid #c7d7fe;
          border-radius: clamp(14px, 4vw, 24px);
          padding: clamp(10px, 3vw, 20px) clamp(10px, 4vw, 24px);
          max-width: 100%;
        }

        .cd-sep {
          display: flex;
          align-items: center;
          padding-bottom: clamp(16px, 4vw, 22px);
          font-size: clamp(1rem, 4vw, 1.75rem);
          font-weight: 900;
          color: #c7d7fe;
          line-height: 1;
          user-select: none;
          flex-shrink: 0;
        }

        .cd-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          flex: 1;
        }

        .cd-num {
          font-size: clamp(1.4rem, 7vw, 3rem);
          font-weight: 900;
          color: #1b4dff;
          letter-spacing: clamp(-1px, -0.05em, -3px);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .cd-lbl {
          font-size: clamp(0.45rem, 1.5vw, 0.625rem);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8ba4f9;
          margin-top: clamp(4px, 1.5vw, 8px);
          white-space: nowrap;
        }

        /* ── REVEAL ANIMATIONS ── */
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .about-nav { padding: 1rem 1.25rem; }
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; padding: 7rem 1.25rem 3rem; gap: 2rem; }
          .hero-visual { height: 260px; }
          .hero-card-main { padding: 1rem; }
          .problem-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .founders-grid { grid-template-columns: 1fr; }
          .trust-grid { grid-template-columns: 1fr; }
          .section { padding: 3rem 1.25rem; }
          .solution-bg { padding: 3rem 1.25rem; }
          .mission-banner { padding: 2.5rem 1.5rem; }
          .cta-section { padding: 3rem 1.25rem; }
          .about-footer { flex-direction: column; gap: 0.75rem; text-align: center; padding: 1.5rem 1.25rem; }
          .divider { margin: 0 1.25rem; }
        }

        @media (max-width: 400px) {
          .problem-stat-grid { grid-template-columns: 1fr; }
          .mission-banner { border-radius: 16px; padding: 2rem 1.25rem; }
          .step-item { grid-template-columns: 44px 1fr; gap: 1rem; }
          .step-number { width: 44px; height: 44px; font-size: 0.875rem; }
          .step-item:not(:last-child)::before { left: 21px; top: 44px; }
        }

        @media (max-width: 300px) {
          .about-nav { padding: 0.75rem; }
          .nav-logo { font-size: 1rem; }
          .nav-cta { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
          .hero { padding: 6rem 0.75rem 2rem; }
          .section { padding: 2rem 0.75rem; }
          .solution-bg { padding: 2rem 0.75rem; }
          .cta-section { padding: 2rem 0.75rem; }
          .about-footer { padding: 1.25rem 0.75rem; }
          .divider { margin: 0 0.75rem; }
          .mission-banner { border-radius: 12px; padding: 1.5rem 0.75rem; }
          .founders-grid { grid-template-columns: 1fr; }
          .trust-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .problem-stat-grid { grid-template-columns: 1fr; }
          .founder-card { padding: 1.25rem; }
          .btn-primary, .btn-secondary { padding: 0.75rem 1.25rem; font-size: 0.8125rem; }
        }
      `}</style>

      <div className="about-root">
        {/* HERO */}
        <section className="hero">
          <div>
            <p className="hero-eyebrow">Our story</p>
            <h1 className="hero-title">
              Buying games should feel <em>safe.</em>
            </h1>
            <p className="hero-body">
              Nepogames was born from frustration. We watched too many people
              lose money buying game accounts online — with nothing to protect
              them. We decided to change that.
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <div className="hc-icon">🎮</div>
              <div>
                <p className="hc-title">Trade protected by escrow</p>
                <p className="hc-sub">Your money moves only when login works</p>
              </div>
            </div>
            <div className="hero-card hero-card-badge">
              <div className="badge-dot" />
              <p className="badge-text">Escrow active — funds held safely</p>
            </div>
            <div className="hero-card hero-card-stat">
              <p className="stat-number">100%</p>
              <p className="stat-label">Secure trades via escrow system</p>
            </div>
          </div>
        </section>

        {/* COUNTDOWN */}
        <LaunchCountdown />

        <div className="divider" />

        {/* THE PROBLEM */}
        <section className="section">
          <p className="section-eyebrow reveal">The problem we saw</p>
          <div className="problem-grid">
            <div>
              <h2 className="section-title reveal reveal-delay-1">
                The online game market was broken
              </h2>
              <p className="section-body reveal reveal-delay-2">
                Every day, thousands of Nigerians and gamers across Africa buy
                and sell game accounts through WhatsApp, Twitter DMs, and random
                websites — with zero protection. Sellers disappear after
                payment. Buyers receive dead accounts. Disputes go nowhere.
                There was no safe place to trade.
              </p>
              <br />
              <p className="section-body reveal reveal-delay-3">
                We saw the same story repeat itself constantly: someone saves up
                money for a FIFA account or a Call of Duty bundle, pays a
                stranger, and ends up with nothing. No recourse. No refund. No
                platform that cared.
              </p>
            </div>

            <div className="problem-stat-grid reveal reveal-delay-2">
              <div className="pstat pstat-large">
                <p className="pstat-number">Millions</p>
                <p className="pstat-label">
                  lost by gamers to scams in online game account trades annually
                </p>
              </div>
              <div className="pstat">
                <p className="pstat-number">0</p>
                <p className="pstat-label">
                  platforms protecting Nigerian gamers before us
                </p>
              </div>
              <div className="pstat">
                <p className="pstat-number">1 in 3</p>
                <p className="pstat-label">
                  online game buyers have been scammed at least once
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SOLUTION */}
        <div className="solution-bg">
          <div className="solution-inner">
            <p className="section-eyebrow reveal">How we fixed it</p>
            <h2 className="section-title reveal reveal-delay-1">
              We built the infrastructure
              <br />
              trust needed to exist
            </h2>
            <p className="section-body reveal reveal-delay-2">
              Nepogames is the first dedicated marketplace for buying and
              selling game accounts in Nigeria — with built-in escrow, verified
              sellers, and a dispute system that actually works.
            </p>

            <div className="features-grid">
              {[
                {
                  icon: "🔒",
                  title: "Escrow protection",
                  desc: "Your money is held securely until you confirm the login details work. The seller only gets paid when you're satisfied.",
                },
                {
                  icon: "✅",
                  title: "Verified sellers",
                  desc: "Sellers on paid plans are manually reviewed. Every listing is visible, traceable, and tied to a real account.",
                },
                {
                  icon: "💬",
                  title: "In-app messaging",
                  desc: "All communication between buyer and seller happens inside Nepogames — fully logged and monitored for safety.",
                },
                {
                  icon: "⚖️",
                  title: "Dispute system",
                  desc: "If something goes wrong, freeze the trade instantly. Our team reviews every dispute and funds stay locked until resolved.",
                },
                {
                  icon: "🏦",
                  title: "Wallet & withdrawals",
                  desc: "Sellers receive funds directly into their Nepogames wallet and can withdraw to any Nigerian bank account.",
                },
                {
                  icon: "🌍",
                  title: "Built for Nigeria",
                  desc: "Payments in Naira via Paystack. Designed for the Nigerian gamer and seller, with a local support team.",
                },
              ].map((f, i) => (
                <div
                  className={`feature-card reveal reveal-delay-${(i % 3) + 1}`}
                  key={i}
                >
                  <div className="feature-icon">{f.icon}</div>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="section">
          <p className="section-eyebrow reveal">How it works</p>
          <h2 className="section-title reveal reveal-delay-1">
            Simple, safe, and fast
          </h2>

          <div className="steps-list">
            {[
              {
                title: "Seller lists their game",
                desc: "A seller creates a listing with photos, price, platform details, and a description of what the buyer will receive. Listings are reviewed before going live.",
              },
              {
                title: "Buyer pays into escrow",
                desc: "The buyer pays via Paystack or their Nepogames wallet. Funds are held securely in escrow — the seller does not receive anything yet.",
              },
              {
                title: "Seller delivers login details",
                desc: "Once payment is confirmed, the seller submits the login credentials through the secure in-app chat. The buyer has 30 minutes to verify access.",
              },
              {
                title: "Buyer confirms it works",
                desc: "If the account works, the buyer confirms and the funds are released to the seller instantly. If not, they raise a dispute and the trade is frozen.",
              },
              {
                title: "Seller withdraws funds",
                desc: "Once confirmed, the seller can withdraw their balance to any Nigerian bank account at any time. Fast, reliable payouts.",
              },
            ].map((s, i) => (
              <div
                className={`step-item reveal reveal-delay-${(i % 3) + 1}`}
                key={i}
              >
                <div className="step-number">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="step-content">
                  <p className="step-title">{s.title}</p>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* FOUNDERS */}
        <section className="section">
          <p className="section-eyebrow reveal">The people behind it</p>
          <h2 className="section-title reveal reveal-delay-1">
            Founded by gamers,
            <br />
            built for gamers
          </h2>
          <p
            className="section-body reveal reveal-delay-2"
            style={{ marginBottom: "0" }}
          >
            Nepogames is a two-person startup driven by a shared belief: that
            fair, safe, and accessible game trading should exist for everyone —
            especially in markets that have been ignored by the rest of the
            world.
          </p>

          <div className="founders-grid">
            <div className="founder-card reveal reveal-delay-2">
              <div className="founder-avatar avatar-blue">FO</div>
              <p className="founder-name">Favour Omirin</p>
              <p className="founder-role">CEO &amp; Co-Founder</p>
              <p className="founder-bio">
                Favour built Nepogames from the ground up — from the first line
                of code to the product you use today. A full stack web developer
                driven by the belief that technology should protect people, not
                expose them.
              </p>
              <Link
                href="https://modred.dev"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  marginTop: "1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#1b4dff",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(27,77,255,0.25)",
                  paddingBottom: "1px",
                }}
              >
                modred.dev ↗
              </Link>
            </div>

            <div className="founder-card reveal reveal-delay-3">
              <div className="founder-avatar avatar-dark">FQ</div>
              <p className="founder-name">Faiq Quadri</p>
              <p className="founder-role">Co-Founder</p>
              <p className="founder-bio">
                Faiq co-founded Nepogames with a shared vision of building
                something that genuinely solves a real problem for gamers. A
                product designer and app developer behind the look, feel, and
                experience of the platform.
              </p>
              <Link
                href="https://faiiq.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  marginTop: "1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#1b4dff",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(27,77,255,0.25)",
                  paddingBottom: "1px",
                }}
              >
                faiq.netlify.app ↗
              </Link>
            </div>
          </div>
        </section>

        {/* MISSION BANNER */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="mission-banner reveal">
            <p className="mission-quote">
              "We built Nepogames because we got tired of watching people lose
              money that they worked hard to earn — just trying to buy a game."
            </p>
            <p className="mission-sub">— Favour Omirin, CEO of Nepogames</p>
          </div>
        </section>

        {/* WHY TRUST */}
        <section className="section" style={{ paddingTop: 0 }}>
          <p className="section-eyebrow reveal">Why choose Nepogames</p>
          <h2 className="section-title reveal reveal-delay-1">
            Everything designed to protect you
          </h2>

          <div className="trust-grid">
            {[
              {
                icon: "🔐",
                title: "Escrow on every trade",
                desc: "No payment leaves until the buyer confirms the account works. Your money is never at risk.",
              },
              {
                icon: "🛡️",
                title: "Dispute resolution",
                desc: "Raise a dispute and the entire transaction is frozen. Our team investigates and protects both sides.",
              },
              {
                icon: "📱",
                title: "Fully in-platform",
                desc: "Every message, every file, every payment happens inside Nepogames. No WhatsApp, no risk.",
              },
              {
                icon: "🧾",
                title: "Full transaction history",
                desc: "Every trade is logged. You can always see what happened, when, and by whom.",
              },
              {
                icon: "⭐",
                title: "Seller ratings",
                desc: "After every trade, buyers rate sellers. A transparent rating system keeps sellers accountable.",
              },
              {
                icon: "🚀",
                title: "Always improving",
                desc: "We ship improvements constantly based on what our community tells us. Your feedback shapes the product.",
              },
            ].map((t, i) => (
              <div
                className={`trust-item reveal reveal-delay-${(i % 2) + 1}`}
                key={i}
              >
                <div className="trust-icon">{t.icon}</div>
                <div>
                  <p className="trust-title">{t.title}</p>
                  <p className="trust-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title reveal">
            Ready to trade
            <br />
            the safe way?
          </h2>
          <p className="cta-sub reveal reveal-delay-1">
            Join thousands of gamers who buy and sell game accounts without the
            stress, the scams, or the sleepless nights.
          </p>
          <WaitlistOrMarketplace />
        </section>
      </div>
    </>
  );
}
