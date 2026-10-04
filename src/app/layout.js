// ROUTE: src/app/layout.js
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Providers from "./Provider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata = {
  metadataBase: new URL("https://nepogames.com"),

  title: {
    default: "Nepogames | Buy & Sell Game Accounts Securely",
    template: "%s | Nepogames",
  },

  description:
    "Buy and sell game accounts safely on Nepogames with secure transactions, direct buyer-seller chat, and scam protection.",

  keywords: [
    "buy game accounts",
    "sell game accounts",
    "secure game marketplace",
    "gaming marketplace",
    "game trading",
    "buy gaming accounts",
    "safe game transactions",
  ],

  openGraph: {
    title: "Nepogames | Buy & Sell Game Accounts Securely",
    description: "Secure marketplace for buying and selling game accounts.",
    url: "https://nepogames.com",
    siteName: "Nepogames",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  // NOTE: no site-wide canonical here — a root canonical is inherited by every
  // page that doesn't override it, which would tell search engines that all
  // pages are duplicates of the homepage. Pages set their own canonical.
  icons: {
    icon: "/icon.png",
    apple: "/nepo-logo.png",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nepogames",
    images: ["/og-image.png"],
    description: "Secure marketplace for buying and selling game accounts.",
  },

  robots: {
    index: true,
    follow: true,
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom is intentionally NOT disabled (WCAG 1.4.4 Resize Text).
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
             
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Nepogames",
                url: "https://nepogames.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://nepogames.com/marketplace?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Nepogames",
                url: "https://nepogames.com",
                description:
                  "Secure marketplace for buying and selling game accounts with escrow protection.",
                logo: {
                  "@type": "ImageObject",
                  url: "https://nepogames.com/nepo-logo.png",
                  width: 512,
                  height: 512,
                },
              },
            ]),
          }}
        />
      </head>
      <body className={`${bricolage.variable} antialiased`}>
        {" "}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
