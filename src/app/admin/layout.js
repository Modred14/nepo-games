// ROUTE: src/app/admin/layout.js
// Admin pages are private, per-user and data-driven: never prerender or index
// them. (This also fixes the build failure caused by useSearchParams() in
// /admin/subscriptions being statically prerendered without a Suspense
// boundary.) Authorization is still enforced server-side on every /api/admin
// route — this layout is not a security control.
export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Admin", template: "%s | Nepogames Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
