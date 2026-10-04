// ROUTE: src/app/pricing/layout.js
export const metadata = {
  title: "Seller Plans & Pricing",
  description: "See Nepogames seller plans and pricing for verified sellers of game accounts.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nepogames.com/pricing" },
  openGraph: {
    title: "Seller Plans & Pricing | Nepogames",
    description: "See Nepogames seller plans and pricing for verified sellers of game accounts.",
    url: "https://nepogames.com/pricing",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }) {
  return children;
}
