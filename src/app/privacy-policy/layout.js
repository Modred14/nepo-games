// ROUTE: src/app/privacy-policy/layout.js
export const metadata = {
  title: "Privacy Policy",
  description: "How Nepogames collects, uses and protects your personal information.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nepogames.com/privacy-policy" },
  openGraph: {
    title: "Privacy Policy | Nepogames",
    description: "How Nepogames collects, uses and protects your personal information.",
    url: "https://nepogames.com/privacy-policy",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }) {
  return children;
}
