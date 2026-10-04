// ROUTE: src/app/reset/[slug]/layout.js
export const metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Nepogames account.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
