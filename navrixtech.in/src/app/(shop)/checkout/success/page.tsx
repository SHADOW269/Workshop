import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, MapPin, Package, ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OrderSummary from "@/components/checkout/order-summary";

export const metadata = { title: "Order Confirmed" };

type SuccessSearchParams = { orderId?: string };

type AddressSnapshot = {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearchParams>;
}) {
  const { orderId } = await searchParams;
  const user = await getCurrentUser();

  if (!orderId || !user) {
    redirect("/dashboard/orders");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true, payment: true },
  });

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Package className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find that order. It may have been placed from another
          account.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="gradient" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">View Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const address = order.shippingAddress as AddressSnapshot;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="gradient-accent flex h-20 w-20 items-center justify-center rounded-full">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve received your order and are getting it ready.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Order Number</span>
          <span className="gradient-accent-text font-mono text-base font-bold">
            {order.orderNumber}
          </span>
        </div>
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order Details
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="secondary">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              <Badge variant="outline">
                Payment:{" "}
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                  order.paymentStatus}
              </Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderSummary
            items={order.items.map((item) => ({
              name: item.productName,
              slug: item.productSlug,
              image: item.image,
              variant: item.variantValue
                ? `${item.variantName}: ${item.variantValue}`
                : null,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            }))}
            subtotal={order.itemsSubtotal}
            discount={order.discount}
            shipping={order.shipping}
            total={order.total}
          />

          <Separator />

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Shipping Address
            </p>
            <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm">
              <p className="font-medium">{address.fullName}</p>
              <p className="mt-0.5 text-muted-foreground">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-muted-foreground">
                {address.city}, {address.state} — {address.pincode},{" "}
                {address.country}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Phone: {address.phone}
              </p>
            </div>
          </div>

          {order.paymentStatus === "PENDING" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Your payment is still being confirmed. We&apos;ll update your order
              status shortly.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="gradient" size="lg" asChild>
          <Link href="/products">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/dashboard/orders">View Orders</Link>
        </Button>
      </div>
    </div>
  );
}
