"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Tag,
  Truck,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useCartStore,
  useCartItems,
  useCartSubtotal,
  useCartCoupon,
} from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from "@/lib/constants";

export default function CartPage() {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const coupon = useCartCoupon();
  const { updateQuantity, removeItem, applyCoupon, removeCoupon, setShipping } =
    useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  useEffect(() => {
    setShipping(shipping);
  }, [shipping, setShipping]);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setCouponError(data?.error ?? "Invalid coupon code");
        return;
      }

      const data = await res.json();
      applyCoupon(couponCode.trim().toUpperCase(), data.discount);
      setCouponCode("");
      toast.success("Coupon applied");
    } catch {
      setCouponError("Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <span className="text-sm text-muted-foreground">
          {items.reduce((n, i) => n + i.quantity, 0)}{" "}
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "item" : "items"}
        </span>
      </div>

      {items.length === 0 ? (
        <Card className="py-20">
          <CardContent className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your cart is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Looks like you haven&apos;t added anything yet.
              </p>
            </div>
            <Button variant="gradient" size="lg" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Items */}
          <Card>
            <CardContent className="p-0">
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
                    <div className="flex gap-4 p-5">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="line-clamp-1 text-sm font-medium hover:text-primary sm:text-base"
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
                            className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary transition-colors hover:bg-accent"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary transition-colors hover:bg-accent"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-semibold">
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
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>

                {/* Free shipping progress */}
                {freeShippingRemaining > 0 && (
                  <div className="rounded-lg border border-border/50 bg-secondary/50 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        Free shipping over ₹999
                      </span>
                      <span className="font-medium text-primary">
                        {formatPrice(freeShippingRemaining)} away
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="gradient-accent h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Coupon */}
                <div>
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{coupon.code}</span>
                        <span className="text-xs font-semibold text-primary">
                          -{formatPrice(coupon.discount)}
                        </span>
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
                        className="h-10"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="shrink-0"
                      >
                        {applyingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {couponError}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shipping estimate
                    </span>
                    <span>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="gradient-accent-text">
                    {formatPrice(total)}
                  </span>
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/products">
                    <ArrowLeft className="h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
