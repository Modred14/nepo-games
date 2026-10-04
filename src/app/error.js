// ROUTE: src/app/error.js
"use client";

// Friendly fallback for unexpected render errors. Shows nothing technical
// (no message, no stack) to the visitor.
export default function Error({ reset }) {
  return (
    <main
      role="alert"
      style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ marginBottom: 16, color: "#4b5563" }}>
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{ background: "#2563eb", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
