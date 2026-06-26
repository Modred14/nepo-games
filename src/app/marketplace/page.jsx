import MarketplaceClient from "./MarketplaceClient";

export const metadata = {
  title: "Marketplace",
  description: "Browse and buy verified game accounts on Nepogames.",
};

export default function Page() {
  return <MarketplaceClient />;
}