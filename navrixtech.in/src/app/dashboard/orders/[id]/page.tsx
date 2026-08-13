import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
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
import CancelOrderButton from "@/components/account/cancel-order-button";
import { statusBadgeVariant } from "@/lib/status";
import { cn } from "@/lib/utils";

export const metadata = { title: "Order Details" };

const FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  const address = order.shippingAddress as AddressSnapshot;
  const flowIndex = FLOW.indexOf(order.status);
  const cancelled = ["CANCELLED", "FAILED", "REFUNDED"].includes(order.status);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(order.status)}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Badge>
            <Badge variant="outline">
              Payment:{" "}
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                order.paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      {cancelled ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-base font-semibold">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.status === "CANCELLED"
                  ? "This order has been cancelled."
                  : order.status === "FAILED"
                    ? "Payment for this order failed."
                    : "This order has been refunded."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <ol className="flex items-center gap-1">
              {FLOW.map((status, i) => {
                const isDone = i <= flowIndex;
                const isCurrent = i === flowIndex;
                return (
                  <li
                    key={status}
                    className="flex flex-1 items-center gap-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          isDone && i < FLOW.length - 1
                            ? "gradient-accent border-transparent text-primary-foreground"
                            : isCurrent
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                        )}
                      >
                        {isDone && i < FLOW.length - 1 ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          "hidden text-xs sm:block",
                          isDone || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {ORDER_STATUS_LABELS[status] ?? status}
                      </span>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div
                        className={cn(
                          "h-px flex-1",
                          i < flowIndex ? "gradient-accent" : "bg-border"
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway</span>
                <span className="capitalize">
                  {order.payment?.gateway ?? "Razorpay"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">
                  {order.payment?.method ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {formatPrice(order.payment?.amount ?? order.total)}
                </span>
              </div>
              {order.payment?.razorpayPaymentId && (
                <>
                  <Separator />
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    ID: {order.payment.razorpayPaymentId}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cancel */}
          {order.status === "PENDING" && (
            <Card className="border-destructive/40">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm">
                  Need to change something? You can cancel this order before it
                  is processed.
                </p>
                <CancelOrderButton orderId={order.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
