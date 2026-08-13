import Link from "next/link";
import { SITE_NAME, SITE_DESCRIPTION, FOOTER_LINKS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/layout/logo";

const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com/navrix", icon: "X" },
  { label: "Instagram", href: "https://instagram.com/navrix", icon: "IG" },
  { label: "Discord", href: "https://discord.gg/navrix", icon: "DC" },
  { label: "YouTube", href: "https://youtube.com/@navrix", icon: "YT" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Navrix home">
              <Logo />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {SITE_DESCRIPTION}
            </p>

            {/* Social */}
            <div className="mt-5 flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Stay updated</p>
              <form
                action="/api/newsletter"
                method="POST"
                className="flex gap-2"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="you@email.com"
                  required
                  className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="submit"
                  className="gradient-accent rounded-md px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Support
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Account
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} {SITE_NAME}. All rights reserved.
          </p>

          <div className="flex gap-2">
            {["UPI", "Visa", "Mastercard", "RuPay"].map((method) => (
              <span
                key={method}
                className="rounded border border-border/60 bg-secondary/50 px-2 py-1 text-[10px] font-medium text-muted-foreground"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
