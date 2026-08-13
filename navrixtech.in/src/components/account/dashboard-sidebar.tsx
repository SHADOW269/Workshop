"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPinned,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: Package },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPinned },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const links = (
    <nav className="space-y-1">
      {LINKS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "gradient-accent text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mb-4 flex items-center justify-between rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Menu className="h-4 w-4" />
          Menu
        </span>
        {open && <X className="h-4 w-4" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="mb-4 rounded-lg border border-border bg-secondary/50 p-4">
              {links}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="sticky top-8 hidden md:block">
        <div className="glass rounded-lg p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="gradient-accent text-primary-foreground">
                {(session?.user?.name ?? "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {session?.user?.name ?? "My Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Separator className="mb-4" />
          {links}
        </div>
      </div>
    </>
  );
}
