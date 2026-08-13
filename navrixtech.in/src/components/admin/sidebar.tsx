"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tags,
  Building2,
  ShoppingCart,
  Users,
  Star,
  Ticket,
  Image,
  Mail,
  MessageSquare,
  Settings,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/brands", label: "Brands", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/contact", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <Link
        href="/admin"
        className="flex h-14 items-center border-b border-sidebar-border px-4"
      >
        <span className="gradient-accent-text text-xl font-bold">Navrix</span>
        <span className="ml-2 text-xs text-muted-foreground">Admin</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
