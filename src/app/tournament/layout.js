// ROUTE: src/app/tournament/layout.js
export const metadata = {
  title: "Gaming Tournaments",
  description: "Join Nepogames gaming tournaments, view prize pools, rules and leaderboards.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://nepogames.com/tournament" },
  openGraph: {
    title: "Gaming Tournaments | Nepogames",
    description: "Join Nepogames gaming tournaments, view prize pools, rules and leaderboards.",
    url: "https://nepogames.com/tournament",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }) {
  return children;
}
