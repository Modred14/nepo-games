// ROUTE: src/app/robots.js
export default function robots() {
  const baseUrl = "https://nepogames.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // robots.txt is NOT access control (every one of these is also
        // protected server-side) — it only keeps well-behaved crawlers out of
        // private / transactional pages.
        disallow: [
          "/admin",
          "/api/",
          "/c/",
          "/profile",
          "/seller",
          "/sell-game",
          "/login",
          "/signup",
          "/verify",
          "/reset",
          "/resetpassword",
          "/payment-success",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
