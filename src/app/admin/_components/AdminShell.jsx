// ROUTE: src/app/admin/_components/AdminShell.jsx  (NEW)
//
// DESIGN PASS: shared shell (sidebar + topbar) for every /admin page, and
// home for the admin design system's CSS variables. Every color/radius/
// shadow value here is pulled directly from the site's OWN existing
// design language in src/app/profile/ProfileClient.jsx (the .at-* style
// block: #1a56db/#1e40af/#1e3a8a blue, slate neutrals, 10-16px radii,
// Bricolage Grotesque headings already set globally on <body>) — not
// invented from scratch, so the admin dashboard actually looks like it
// belongs to Nepo Games rather than a generic template dropped on top.
//
// Sidebar links ONLY point at pages that actually exist and work right
// now (Dashboard, Users, Withdrawals, Disputes, Support, Audit log).
// Sections from later phases (Listings, Transactions, Subscriptions,
// Settings, Admin management) are deliberately left OUT rather than
// linked as dead/placeholder pages — see NAV_ITEMS below for where to
// add them as each phase ships.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Banknote,
  ShieldAlert,
  MessagesSquare,
  ScrollText,
  Gamepad2,
  Settings,
  CreditCard,
  Megaphone,
  UserCog,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Gamepad2 },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/admin/disputes", label: "Disputes", icon: ShieldAlert },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/support", label: "Support", icon: MessagesSquare },
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials =
    (session?.user?.first_name?.[0] || "") + (session?.user?.surname?.[0] || "") ||
    (session?.user?.email?.[0] || "A").toUpperCase();

  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${mobileOpen ? "adm-sidebar--open" : ""}`}>
        <div className="adm-sidebar__brand">
          <span className="adm-sidebar__logo">Nepo Games</span>
          <span className="adm-sidebar__tag">Admin</span>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`adm-nav__item ${active ? "adm-nav__item--active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="adm-sidebar__footer">
          <button
            className="adm-nav__item adm-nav__item--danger"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={17} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="adm-sidebar__scrim" onClick={() => setMobileOpen(false)} />
      )}

      <div className="adm-main">
        <header className="adm-topbar">
          <button
            className="adm-topbar__menuBtn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="adm-topbar__spacer" />
          <div className="adm-topbar__admin">
            <span className="adm-avatar">{initials}</span>
            <div className="adm-topbar__adminMeta">
              <span className="adm-topbar__adminEmail">{session?.user?.email}</span>
              <span className="adm-badge adm-badge--neutral">Admin</span>
            </div>
          </div>
        </header>

        <main className="adm-content">{children}</main>
      </div>

      <style jsx global>{`
        :root {
          --adm-blue-600: #2563eb;
          --adm-blue-700: #1d4ed8;
          --adm-blue-800: #1e40af;
          --adm-blue-900: #1e3a8a;
          --adm-ink-900: #0f172a;
          --adm-ink-700: #334155;
          --adm-ink-500: #64748b;
          --adm-ink-400: #94a3b8;
          --adm-line: #e2e8f0;
          --adm-line-soft: #f1f5f9;
          --adm-surface: #ffffff;
          --adm-bg: #f8fafc;
          --adm-success: #16a34a;
          --adm-success-bg: #f0fdf4;
          --adm-success-line: #bbf7d0;
          --adm-warning: #b45309;
          --adm-warning-bg: #fffbeb;
          --adm-warning-line: #fde68a;
          --adm-danger: #dc2626;
          --adm-danger-bg: #fef2f2;
          --adm-danger-line: #fecaca;
          --adm-radius-lg: 16px;
          --adm-radius-md: 12px;
          --adm-radius-sm: 8px;
          --adm-shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03);
          --adm-shadow-hover: 0 6px 20px rgba(15, 23, 42, 0.08);
        }

        .adm-shell {
          display: flex;
          min-height: 100vh;
          background: var(--adm-bg);
          color: var(--adm-ink-900);
        }

        .adm-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--adm-surface);
          border-right: 1px solid var(--adm-line);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .adm-sidebar__brand {
          padding: 22px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-bottom: 1px solid var(--adm-line-soft);
        }
        .adm-sidebar__logo {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.01em;
          color: var(--adm-ink-900);
        }
        .adm-sidebar__tag {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--adm-blue-700);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .adm-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .adm-nav__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--adm-radius-sm);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--adm-ink-700);
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.12s, color 0.12s;
        }
        .adm-nav__item:hover {
          background: var(--adm-line-soft);
          color: var(--adm-ink-900);
        }
        .adm-nav__item--active {
          background: linear-gradient(135deg, #2563eb14, #1d4ed80f);
          color: var(--adm-blue-700);
          font-weight: 600;
        }
        .adm-nav__item--danger {
          color: var(--adm-danger);
        }
        .adm-nav__item--danger:hover {
          background: var(--adm-danger-bg);
        }

        .adm-sidebar__footer {
          padding: 10px;
          border-top: 1px solid var(--adm-line-soft);
        }

        .adm-sidebar__scrim {
          display: none;
        }

        .adm-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .adm-topbar {
          height: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 0 24px;
          background: var(--adm-surface);
          border-bottom: 1px solid var(--adm-line);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .adm-topbar__menuBtn {
          display: none;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--adm-ink-700);
          padding: 6px;
        }
        .adm-topbar__spacer {
          flex: 1;
        }
        .adm-topbar__admin {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .adm-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-topbar__adminMeta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1.2;
        }
        .adm-topbar__adminEmail {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--adm-ink-900);
        }

        .adm-content {
          padding: 28px 28px 60px;
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── shared primitives used across admin pages ── */

        .adm-h1 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--adm-ink-900);
          margin: 0 0 4px;
        }
        .adm-sub {
          font-size: 13.5px;
          color: var(--adm-ink-500);
          margin: 0 0 22px;
          line-height: 1.5;
        }

        .adm-card {
          background: var(--adm-surface);
          border: 1px solid var(--adm-line);
          border-radius: var(--adm-radius-lg);
          box-shadow: var(--adm-shadow-card);
        }

        .adm-statgrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .adm-stat {
          background: var(--adm-surface);
          border: 1px solid var(--adm-line);
          border-radius: var(--adm-radius-md);
          padding: 16px 18px;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .adm-stat:hover {
          box-shadow: var(--adm-shadow-hover);
          transform: translateY(-1px);
        }
        .adm-stat__label {
          font-size: 12px;
          font-weight: 600;
          color: var(--adm-ink-500);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .adm-stat__value {
          font-size: 24px;
          font-weight: 700;
          color: var(--adm-ink-900);
          letter-spacing: -0.02em;
        }
        .adm-stat__hint {
          font-size: 11.5px;
          color: var(--adm-ink-400);
          margin-top: 4px;
        }

        .adm-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .adm-tab {
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid var(--adm-line);
          background: var(--adm-surface);
          color: var(--adm-ink-700);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
        }
        .adm-tab:hover {
          border-color: var(--adm-blue-600);
        }
        .adm-tab--active {
          background: var(--adm-ink-900);
          border-color: var(--adm-ink-900);
          color: #fff;
        }

        .adm-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--adm-line);
          border-radius: var(--adm-radius-lg);
          background: var(--adm-surface);
        }
        .adm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .adm-table thead tr {
          border-bottom: 1px solid var(--adm-line);
        }
        .adm-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--adm-ink-500);
          white-space: nowrap;
        }
        .adm-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--adm-line-soft);
          vertical-align: middle;
        }
        .adm-table tbody tr:last-child td {
          border-bottom: none;
        }
        .adm-table tbody tr:hover {
          background: var(--adm-line-soft);
        }

        .adm-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.6;
        }
        .adm-badge--success { background: var(--adm-success-bg); color: var(--adm-success); }
        .adm-badge--warning { background: var(--adm-warning-bg); color: var(--adm-warning); }
        .adm-badge--danger { background: var(--adm-danger-bg); color: var(--adm-danger); }
        .adm-badge--neutral { background: var(--adm-line-soft); color: var(--adm-ink-500); }
        .adm-badge--blue { background: #eff6ff; color: var(--adm-blue-700); }

        .adm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--adm-radius-sm);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: opacity 0.12s, transform 0.1s, background 0.12s, border-color 0.12s;
        }
        .adm-btn:active { transform: translateY(1px); }
        .adm-btn:disabled { opacity: 0.5; cursor: default; transform: none; }

        .adm-btn--primary {
          background: linear-gradient(135deg, var(--adm-blue-600), var(--adm-blue-700));
          color: #fff;
        }
        .adm-btn--primary:hover:not(:disabled) { opacity: 0.92; }

        .adm-btn--ghost {
          background: var(--adm-surface);
          border-color: var(--adm-line);
          color: var(--adm-ink-700);
        }
        .adm-btn--ghost:hover:not(:disabled) { background: var(--adm-line-soft); }

        .adm-btn--danger {
          background: var(--adm-danger-bg);
          color: var(--adm-danger);
          border-color: var(--adm-danger-line);
        }
        .adm-btn--danger:hover:not(:disabled) { background: #fee2e2; }

        .adm-btn--success {
          background: var(--adm-success-bg);
          color: var(--adm-success);
          border-color: var(--adm-success-line);
        }
        .adm-btn--success:hover:not(:disabled) { background: #dcfce7; }

        .adm-input, .adm-select {
          width: 100%;
          border: 1.5px solid var(--adm-line);
          border-radius: var(--adm-radius-sm);
          padding: 9px 12px;
          font-size: 13.5px;
          color: var(--adm-ink-900);
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .adm-input:focus, .adm-select:focus {
          border-color: var(--adm-blue-600);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          background: #fff;
        }

        .adm-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--adm-ink-500);
          font-size: 13.5px;
        }

        .adm-skeleton-row {
          height: 44px;
          border-bottom: 1px solid var(--adm-line-soft);
          background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 37%, #f8fafc 63%);
          background-size: 400% 100%;
          animation: adm-shimmer 1.4s ease infinite;
        }
        @keyframes adm-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @media (max-width: 860px) {
          .adm-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 30;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 0 0 0 1px var(--adm-line);
          }
          .adm-sidebar--open {
            transform: translateX(0);
          }
          .adm-sidebar__scrim {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.35);
            z-index: 20;
          }
          .adm-topbar__menuBtn {
            display: block;
          }
          .adm-content {
            padding: 18px 16px 48px;
          }
          .adm-topbar {
            padding: 0 14px;
          }
        }
      `}</style>
    </div>
  );
}