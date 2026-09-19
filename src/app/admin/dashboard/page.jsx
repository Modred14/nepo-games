// ROUTE: src/app/admin/dashboard/page.jsx  (NEW)
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "../_components/AdminShell";
import {
  Users,
  UserCheck,
  ShieldBan,
  Store,
  ShoppingBag,
  Wallet,
  Landmark,
  Clock,
  Receipt,
} from "lucide-react";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "This year" },
];

function naira(n) {
  return `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="adm-stat">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="adm-stat__label">{label}</span>
        {Icon && <Icon size={15} color="var(--adm-ink-400)" />}
      </div>
      <div className="adm-stat__value">{value}</div>
      {hint && <div className="adm-stat__hint">{hint}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--adm-ink-500)",
        margin: "28px 0 12px",
      }}
    >
      {children}
    </h2>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (r) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${r}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load dashboard");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  return (
    <AdminShell>
      <h1 className="adm-h1">Dashboard</h1>
      <p className="adm-sub">
        Overview of the business right now. Some numbers (marked below) are for the
        selected date range; others — like escrow currently held or current subscribers —
        always reflect the live state.
      </p>

      <div className="adm-tabs">
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={`adm-tab ${range === r.key ? "adm-tab--active" : ""}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="adm-card" style={{ padding: 16, color: "var(--adm-danger)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="adm-statgrid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="adm-stat">
              <div className="adm-skeleton-row" style={{ height: 40, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <SectionTitle>Users</SectionTitle>
          <div className="adm-statgrid">
            <StatCard icon={Users} label="Total users" value={data.users.total.toLocaleString()} />
            <StatCard icon={Users} label="New today" value={data.users.newToday.toLocaleString()} />
            <StatCard
              icon={Users}
              label={`New in range`}
              value={data.users.newInRange.toLocaleString()}
            />
            <StatCard
              icon={UserCheck}
              label="Active users"
              value={data.users.active30d.toLocaleString()}
              hint={data.users.activeDefinition}
            />
            <StatCard icon={Store} label="Sellers" value={data.users.sellers.toLocaleString()} />
            <StatCard icon={ShoppingBag} label="Buyers" value={data.users.buyers.toLocaleString()} />
            <StatCard
              icon={ShieldBan}
              label="Suspended"
              value={data.users.suspended.toLocaleString()}
            />
            <StatCard icon={ShieldBan} label="Banned" value={data.users.banned.toLocaleString()} />
          </div>

          <SectionTitle>Marketplace</SectionTitle>
          <div className="adm-statgrid">
            <StatCard label="Total listings" value={data.listings.total.toLocaleString()} />
            <StatCard label="Active" value={data.listings.active.toLocaleString()} />
            <StatCard label="Pending" value={data.listings.pending.toLocaleString()} />
            <StatCard label="Processing" value={data.listings.processing.toLocaleString()} />
          </div>

          <SectionTitle>Transactions — selected range</SectionTitle>
          <div className="adm-statgrid">
            <StatCard label="Total" value={data.transactions.totalInRange.toLocaleString()} />
            <StatCard label="Completed" value={data.transactions.completed.toLocaleString()} />
            <StatCard label="Pending" value={data.transactions.pending.toLocaleString()} />
            <StatCard label="Failed" value={data.transactions.failed.toLocaleString()} />
            <StatCard label="Disputed" value={data.transactions.disputed.toLocaleString()} />
            <StatCard label="Refunded" value={data.transactions.refunded.toLocaleString()} />
            <StatCard
              icon={Landmark}
              label="Escrow held now"
              value={naira(data.transactions.escrowHeldNow)}
              hint="Live, not range-based"
            />
          </div>

          <SectionTitle>Withdrawals</SectionTitle>
          <div className="adm-statgrid">
            <StatCard icon={Clock} label="Pending" value={data.withdrawals.pending.toLocaleString()} />
            <StatCard label="Unknown / needs review" value={data.withdrawals.unknown.toLocaleString()} />
            <StatCard label="Successful" value={data.withdrawals.success.toLocaleString()} />
            <StatCard label="Failed" value={data.withdrawals.failed.toLocaleString()} />
            <StatCard
              icon={Wallet}
              label="Total withdrawn (range)"
              value={naira(data.withdrawals.totalWithdrawnInRange)}
            />
          </div>

          <SectionTitle>Revenue — selected range</SectionTitle>
          <div className="adm-statgrid">
            <StatCard
              icon={Receipt}
              label="Platform fees"
              value={naira(data.revenue.platformFeesInRange)}
              hint="From marketplace sales"
            />
            <StatCard
              icon={Receipt}
              label="Withdrawal fees"
              value={naira(data.revenue.withdrawalFeesInRange)}
            />
            <StatCard
              icon={Receipt}
              label="Subscription revenue"
              value={naira(data.revenue.subscriptionRevenueInRange)}
            />
          </div>

          <SectionTitle>Subscriptions — live</SectionTitle>
          <div className="adm-statgrid">
            {["free", "pro", "plus", "premium"].map((plan) => (
              <StatCard
                key={plan}
                label={plan[0].toUpperCase() + plan.slice(1)}
                value={(data.subscriptions.byPlan[plan] || 0).toLocaleString()}
              />
            ))}
            <StatCard
              label="Expiring within 7 days"
              value={data.subscriptions.expiringWithin7Days.toLocaleString()}
            />
          </div>
        </>
      )}
    </AdminShell>
  );
}