// ROUTE: src/app/about/layout.js
export const metadata = {
  title: "About",
  description: "Learn how Nepogames helps gamers buy and sell game accounts securely with escrow-style payment protection and buyer-seller chat.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nepogames.com/about" },
  openGraph: {
    title: "About Nepogames",
    description: "Learn how Nepogames helps gamers buy and sell game accounts securely with escrow-style payment protection and buyer-seller chat.",
    url: "https://nepogames.com/about",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }) {
  return children;
}
