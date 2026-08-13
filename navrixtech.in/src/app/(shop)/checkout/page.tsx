"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AddressForm, {
  type AddressInput,
} from "@/components/checkout/address-form";
import OrderSummary from "@/components/checkout/order-summary";
import {
  useCartStore,
  useCartItems,
  useCartSubtotal,
  useCartCoupon,
} from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import {
  SITE_NAME,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_RATE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type SavedAddress = AddressInput & { id: string };

const STEPS = ["Address", "Shipping", "Payment", "Review"];

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill: { name: string; email: string; contact?: string };
      theme: { color: string };
      handler: (response: RazorpayResponse) => void;
      modal: { ondismiss: () => void };
    }) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector("script[data-razorpay]")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.setAttribute("data-razorpay", "");
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const coupon = useCartCoupon();
  const { clearCart, setShipping } = useCartStore();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    null
  );
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressInput | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [shippingOption, setShippingOption] = useState<"standard" | "express">(
    "standard"
  );
  const [placingOrder, setPlacingOrder] = useState(false);

  const freeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping =
    shippingOption === "express" || !freeShippingEligible
      ? FLAT_SHIPPING_RATE
      : 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const address = selectedAddress ?? newAddress;

  // Redirect empty cart to /cart
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Load saved addresses
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setAddresses(data.addresses);
            const defaultAddress = data.addresses.find(
              (a: SavedAddress) => a.isDefault
            );
            if (defaultAddress) setSelectedAddress(defaultAddress);
          }
        }
      } catch {
        // ignore — user can add a new address
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setShipping(shipping);
  }, [shipping, setShipping]);

  const addressPayload = address
    ? {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      }
    : null;

  const handleNewAddressSubmit = async (data: AddressInput) => {
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setNewAddress(result.address);
        setAddresses((prev) => [...prev, result.address]);
      } else {
        setNewAddress(data);
      }
    } catch {
      setNewAddress(data);
    } finally {
      setSavingAddress(false);
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    if (!addressPayload) return;
    setPlacingOrder(true);

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variant?.id ?? null,
            quantity: i.quantity,
          })),
          address: addressPayload,
          shipping,
          couponCode: coupon?.code ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create order");
        setPlacingOrder(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load payment gateway");
        setPlacingOrder(false);
        return;
      }

      const dbOrderId = data.dbOrderId as string;

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: SITE_NAME,
        description: data.orderNumber,
        order_id: data.orderId,
        prefill: {
          name: session?.user?.name ?? addressPayload.fullName,
          email: session?.user?.email ?? "",
          contact: addressPayload.phone,
        },
        theme: { color: "#22d3ee" },
        handler: async (response: RazorpayResponse) => {
          try {
            await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
          } catch {
            // order stays PENDING; webhook can settle it
          }
          clearCart();
          router.replace(`/checkout/success?orderId=${dbOrderId}`);
        },
        modal: { ondismiss: () => setPlacingOrder(false) },
      });

      razorpay.open();
    } catch {
      toast.error("Something went wrong");
      setPlacingOrder(false);
    }
  };

  const progress = (
    <ol className="mb-8 flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((label, i) => {
        const index = i + 1;
        const isActive = index === step;
        const isDone = index < step;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isDone &&
                    "gradient-accent border-transparent text-primary-foreground",
                  isActive &&
                    "border-primary text-primary",
                  !isDone && !isActive && "border-border text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : index}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length && (
              <div
                className={cn(
                  "h-px flex-1",
                  isDone ? "gradient-accent" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );

  const backButton = step > 1 && (
    <Button
      variant="ghost"
      onClick={() => setStep((s) => s - 1)}
      className="mt-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Checkout</h1>
      {progress}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <AnimatePresence mode="wait">
            {/* STEP 1 — Address */}
            {step === 1 && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="h-5 w-5 text-primary" />
                      Delivery Address
                    </h2>

                    {addressesLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : addresses.length > 0 && !addingNewAddress ? (
                      <>
                        <div className="space-y-3">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                                selectedAddress?.id === addr.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-accent"
                              )}
                            >
                              <input
                                type="radio"
                                name="savedAddress"
                                className="mt-1 h-4 w-4 accent-primary"
                                checked={selectedAddress?.id === addr.id}
                                onChange={() => setSelectedAddress(addr)}
                              />
                              <span className="text-sm">
                                <span className="flex items-center gap-2 font-medium">
                                  {addr.fullName}
                                  {addr.isDefault && (
                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                                      Default
                                    </span>
                                  )}
                                </span>
                                <span className="mt-0.5 block text-muted-foreground">
                                  {addr.line1}
                                  {addr.line2 ? `, ${addr.line2}` : ""},{" "}
                                  {addr.city}, {addr.state} — {addr.pincode},{" "}
                                  {addr.country}
                                </span>
                                <span className="mt-0.5 block text-muted-foreground">
                                  Phone: {addr.phone}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setAddingNewAddress(true)}
                        >
                          + Add New Address
                        </Button>
                      </>
                    ) : (
                      <AddressForm
                        onSubmit={handleNewAddressSubmit}
                        loading={savingAddress}
                        submitLabel="Save & Continue"
                      />
                    )}

                    {addingNewAddress && (
                      <div className="space-y-4 border-t pt-4">
                        <AddressForm
                          onSubmit={handleNewAddressSubmit}
                          loading={savingAddress}
                          submitLabel="Save & Continue"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => setAddingNewAddress(false)}
                        >
                          Back to saved addresses
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Button
                  variant="gradient"
                  size="lg"
                  className="mt-6 w-full sm:w-auto"
                  disabled={!address}
                  onClick={() => setStep(2)}
                >
                  Continue to Shipping
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2 — Shipping */}
            {step === 2 && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Method
                    </h2>

                    <RadioGroup
                      value={shippingOption}
                      onValueChange={(v) =>
                        setShippingOption(v as "standard" | "express")
                      }
                      className="gap-3"
                    >
                      <label
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-4 transition-colors",
                          shippingOption === "standard"
                            ? "border-primary bg-primary/5"
                            : "border-border",
                          !freeShippingEligible && "opacity-50"
                        )}
                      >
                        <RadioGroupItem
                          value="standard"
                          disabled={!freeShippingEligible}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Standard Delivery
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {freeShippingEligible
                              ? "5-7 business days"
                              : `Add ${formatPrice(
                                  FREE_SHIPPING_THRESHOLD - subtotal
                                )} more to unlock free shipping`}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {freeShippingEligible ? "Free" : "—"}
                        </span>
                      </label>

                      <label
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-4 transition-colors",
                          shippingOption === "express"
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <RadioGroupItem value="express" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Express Delivery</p>
                          <p className="text-xs text-muted-foreground">
                            2-4 business days
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(FLAT_SHIPPING_RATE)}
                        </span>
                      </label>
                    </RadioGroup>
                  </CardContent>
                </Card>
                <div className="mt-6 flex gap-3">
                  {backButton}
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => setStep(3)}
                  >
                    Continue to Payment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Payment */}
            {step === 3 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="space-y-5">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment
                    </h2>

                    <div className="rounded-lg border border-border bg-secondary/50 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4 text-primary" />
                        Secured by Razorpay
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pay securely via UPI, cards, net banking or wallets.
                        Your payment details are encrypted end-to-end.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map(
                        (m) => (
                          <span
                            key={m}
                            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {m}
                          </span>
                        )
                      )}
                    </div>

                    <div className="rounded-lg border border-border bg-primary/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Order Protection
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        You&apos;ll review and confirm your order before the payment
                        is charged.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-6 flex gap-3">
                  {backButton}
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => setStep(4)}
                  >
                    Review Order
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Review */}
            {step === 4 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="space-y-5">
                    <h2 className="text-lg font-semibold">Review Your Order</h2>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          Deliver to
                        </p>
                        {address && (
                          <p className="text-sm">
                            <span className="font-semibold">
                              {address.fullName}
                            </span>
                            <span className="block text-muted-foreground">
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ""},{" "}
                              {address.city}, {address.state} —{" "}
                              {address.pincode}, {address.country}
                            </span>
                            <span className="block text-muted-foreground">
                              Phone: {address.phone}
                            </span>
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <Truck className="h-4 w-4 text-primary" />
                          Shipping
                        </p>
                        <p className="text-sm">
                          {shippingOption === "express" || !freeShippingEligible
                            ? `Express Delivery — ${formatPrice(shipping)}`
                            : "Standard Delivery — Free"}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <Package className="h-4 w-4 text-primary" />
                          Items ({items.reduce((n, i) => n + i.quantity, 0)})
                        </p>
                        <OrderSummary
                          items={items.map((i) => ({
                            name: i.name,
                            slug: i.slug,
                            image: i.image,
                            variant: i.variant
                              ? `${i.variant.name}: ${i.variant.value}`
                              : null,
                            unitPrice: i.price,
                            quantity: i.quantity,
                          }))}
                          subtotal={subtotal}
                          discount={discount}
                          shipping={shipping}
                          total={total}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {backButton}
                  <Button
                    variant="gradient"
                    size="lg"
                    className="sm:ml-auto"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Pay {formatPrice(total)} Securely
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar summary */}
        <aside className="hidden lg:block">
          <Card className="sticky top-8">
            <CardContent>
              <h3 className="mb-4 text-base font-semibold">Order Summary</h3>
              {items.length > 0 ? (
                <OrderSummary
                  items={items.map((i) => ({
                    name: i.name,
                    slug: i.slug,
                    image: i.image,
                    variant: i.variant
                      ? `${i.variant.name}: ${i.variant.value}`
                      : null,
                    unitPrice: i.price,
                    quantity: i.quantity,
                  }))}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {items.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button variant="gradient" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
