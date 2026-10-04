// ROUTE: src/app/terms-of-service/layout.js
export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern buying, selling and payments on the Nepogames game-account marketplace.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nepogames.com/terms-of-service" },
  openGraph: {
    title: "Terms of Service | Nepogames",
    description: "The terms that govern buying, selling and payments on the Nepogames game-account marketplace.",
    url: "https://nepogames.com/terms-of-service",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }) {
  return children;
}
