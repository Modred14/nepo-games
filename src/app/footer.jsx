import React from "react";
import { X, Instagram, Music2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        {/* Layout: stack on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Left brand block */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-wide">NEPO GAMES</h3>

            <p className="max-w-sm text-sm leading-6 text-white/85">
              Your Trusted Gaming Account Marketplace. Buy, sell, and trade
              premium accounts with confidence and security.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              <SocialIcon href="#" label="X">
                <X className="h-4 w-4" />
              </SocialIcon>

              <SocialIcon href="#" label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialIcon>

              <SocialIcon href="#" label="TikTok">
                <Music2 className="h-4 w-4" />
              </SocialIcon>

              <SocialIcon href="#" label="Email">
                <Mail className="h-4 w-4" />
              </SocialIcon>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid md:ml-auto justify-items-start items-start grid-cols-3 gap-8">
            <FooterCol
              title="Company"
              links={[
                { label: "About", href: "#" },
                { label: "Career", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Contact", href: "#" },
              ]}
            />

            <FooterCol
              title="Product"
              links={[
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Support", href: "#" },
              ]}
            />

            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of service", href: "#" },
                { label: "CAC Reg", href: "#" },
              ]}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-white/85 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/20 ring-1 ring-white/15 hover:bg-black/30 hover:ring-white/25 transition"
    >
      {children}
    </a>
  );
}
