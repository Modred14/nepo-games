// ROUTE: src/app/profile/layout.js
export const metadata = {
  title: "Your profile",
  description: "Manage your Nepogames account, wallet and listings.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
