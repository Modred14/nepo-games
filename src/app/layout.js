import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./Provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL("https://nepogames.com"),

  title: {
    default: "Nepo Games | Buy & Sell Game Accounts Securely",
    template: "%s | Nepo Games",
  },

  description:
    "Buy and sell game accounts safely on Nepo Games with secure transactions, direct buyer-seller chat, and scam protection.",

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
    title: "Nepo Games | Buy & Sell Game Accounts Securely",
    description:
      "Secure marketplace for buying and selling game accounts.",
    url: "https://nepogames.com",
    siteName: "Nepo Games",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nepo Games",
    description:
      "Secure marketplace for buying and selling game accounts.",
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
      <body className={`${poppins.variable} antialiased`}>
        {" "}
        <Providers>
          
          {children}
        </Providers>
      </body>
    </html>
  );
}
