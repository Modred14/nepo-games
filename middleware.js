// middleware.js (place at the root of your project, next to package.json)

import { NextResponse } from "next/server";

const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /ia_archiver/i,
  /msnbot/i,
  /crawler/i,
  /spider/i,
  /bot\//i,
  /robot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /gptbot/i,
  /claudebot/i,
  /anthropic/i,
  /openai/i,
  /ccbot/i,
  /chatgpt/i,
  /cohere/i,
  /perplexity/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,
];

function isBot(userAgent) {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".local");

  if (isLocalhost) return NextResponse.next();

  if (hostname !== "nepogames.com" && !hostname.endsWith(".nepogames.com")) {
    return NextResponse.next();
  }

  const deadline = new Date("2025-07-01T00:00:00Z");
  if (new Date() >= deadline) return NextResponse.next();

  const userAgent = request.headers.get("user-agent") || "";
  if (isBot(userAgent)) return NextResponse.next();

  if (pathname.startsWith("/about")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/about";
  return NextResponse.redirect(url, { status: 307 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)",
  ],
};
