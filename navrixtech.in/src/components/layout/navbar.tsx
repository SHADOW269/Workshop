"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";
import { useCartItemCount } from "@/stores/cart";
import { useWishlistCount } from "@/stores/wishlist";
import SearchOverlay from "@/components/layout/search-overlay";
import CartDrawer from "@/components/layout/cart-drawer";
import Logo from "@/components/layout/logo";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Navbar() {
  const { data: session } = useSession();
  const itemCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const { toggleSearch, toggleCart } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "glass shadow-lg shadow-black/10"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Navrix home">
              <Logo />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSearch}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/dashboard/wishlist">
              <Button variant="ghost" size="icon" aria-label="Wishlist" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="gradient"
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              aria-label="Cart"
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="gradient"
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User menu (desktop) */}
            <div className="hidden md:block">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Account">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{session.user?.name ?? "Account"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/wishlist" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" asChild aria-label="Login">
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile hamburger */}
            {isMobile && (
              <MobileNav
                session={session}
                itemCount={itemCount}
                wishlistCount={wishlistCount}
              />
            )}
          </div>
        </div>
      </header>

      <SearchOverlay />
      <CartDrawer />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}

function MobileNav({
  session,
  itemCount,
  wishlistCount,
}: {
  session: ReturnType<typeof useSession>["data"];
  itemCount: number;
  wishlistCount: number;
}) {
  const { toggleSearch, toggleCart } = useUIStore();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col py-4">
          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="flex flex-col gap-1 px-4">
            <button
              onClick={() => {
                setOpen(false);
                toggleSearch();
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

            <Link
              href="/dashboard/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Heart className="h-4 w-4" />
              Wishlist
              {wishlistCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {wishlistCount}
                </Badge>
              )}
            </Link>

            <button
              onClick={() => {
                setOpen(false);
                toggleCart();
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {itemCount}
                </Badge>
              )}
            </button>
          </div>

          <Separator className="my-4" />

          <div className="px-4">
            {session ? (
              <>
                <div className="mb-3 px-3">
                  <p className="text-sm font-medium">{session.user?.name ?? "Account"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user?.email}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Button variant="gradient" className="w-full" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Login / Sign Up
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
