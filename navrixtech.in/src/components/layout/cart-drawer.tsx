"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCartStore,
  useCartItems,
  useCartSubtotal,
  useCartItemCount,
} from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export default function CartDrawer() {
  const { cartOpen, toggleCart } = useUIStore();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const { updateQuantity, removeItem, appliedCoupon, applyCoupon, removeCoupon } =
    useCartStore();

  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    // Coupon validation — hit /api/coupons/validate in production
    // For now, simple mock: "WELCOME10" gives ₹100 off
    if (couponCode.toUpperCase() === "WELCOME10") {
      applyCoupon("WELCOME10", 10000);
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={toggleCart}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart
            {itemCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add items to get started
              </p>
            </div>
            <Button variant="gradient" asChild>
              <Link href="/products" onClick={toggleCart}>
                Browse Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Free shipping progress */}
              {freeShippingRemaining > 0 && (
                <div className="mb-4 rounded-lg border border-border/50 bg-secondary/50 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Free shipping over ₹999
                    </span>
                    <span className="font-medium text-primary">
                      {formatPrice(freeShippingRemaining)} away
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full gradient-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex gap-3 py-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={toggleCart}
                              className="line-clamp-1 text-sm font-medium hover:text-primary"
                            >
                              {item.name}
                            </Link>
                            {item.variant && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.variant.name}: {item.variant.value}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-2">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-secondary transition-colors hover:bg-accent"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-secondary transition-colors hover:bg-accent"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            {item.compareAtPrice &&
                              item.compareAtPrice > item.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatPrice(
                                    item.compareAtPrice * item.quantity
                                  )}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4">
              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {appliedCoupon.code}
                      </span>
                      <Badge variant="gradient" className="text-[10px]">
                        -{formatPrice(appliedCoupon.discount)}
                      </Badge>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError("");
                      }}
                      placeholder="Coupon code"
                      className="h-9 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1 text-xs text-destructive">{couponError}</p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="gradient-accent-text">
                    {formatPrice(
                      subtotal - (appliedCoupon?.discount ?? 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Checkout */}
              <Button variant="gradient" className="mt-4 w-full" size="lg" asChild>
                <Link href="/checkout" onClick={toggleCart}>
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="mt-2 w-full" asChild>
                <Link href="/cart" onClick={toggleCart}>
                  View Full Cart
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
