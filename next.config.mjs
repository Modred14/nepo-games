// ROUTE: next.config.mjs
/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Realtime chat connects straight from the browser to the external socket
// service (NEXT_PUBLIC_SOCKET_URL). It has to be allowed in connect-src, both
// as http(s) and as ws(s).
function socketSources() {
  const raw = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return [u.origin, `${wsProto}//${u.host}`];
  } catch {
    return [];
  }
}

// Content-Security-Policy built from what the app actually loads:
//  - Next.js injects inline bootstrap scripts, so script-src needs
//    'unsafe-inline' (a nonce-based CSP needs per-request middleware; tracked
//    as a follow-up in the audit report). 'unsafe-eval' is dev-only (React
//    refresh).
//  - styles: inline <style> blocks + Google Fonts CSS (@import in several pages)
//  - fonts: fonts.gstatic.com
//  - images: own origin, Cloudinary (listing photos / avatars), Google
//    profile photos, flaticon default avatar, ui-avatars fallback, svgrepo
//    (Google logo), icons8 — and data:/blob: for previews.
//  - connect: own origin + socket service. Payments redirect the whole page to
//    Flutterwave's hosted checkout, so no Flutterwave script/frame is needed.
//  - frame-ancestors 'none': nobody may embed the site (clickjacking).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://ui-avatars.com https://www.svgrepo.com https://img.icons8.com",
  `connect-src 'self' ${socketSources().join(" ")}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Per-user / sensitive API responses must never be stored by a
      // browser or shared cache.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
