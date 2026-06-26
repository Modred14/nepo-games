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
  },
  alternates: {
    canonical: "https://nepogames.com",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nepogames",
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
  maximumScale: 1,
  userScalable: false,
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
                name: "Nepogames", // ✅ fixes site name in Google
                url: "https://nepogames.com",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Nepogames",
                url: "https://nepogames.com",
                logo: {
                  "@type": "ImageObject",
                  // ✅ Must be an absolute URL to your logo image
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
