import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { slug: true, images: { take: 1 } } } },
      },
      payment: true,
    },
  });

  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string>;
  const timeline = [
    { status: "PENDING", label: "Order Placed", date: order.createdAt },
    ...(order.status !== "PENDING"
      ? [{ status: order.status, label: ORDER_STATUS_LABELS[order.status], date: order.updatedAt }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        width={60}
                        height={60}
                        className="h-15 w-15 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-15 w-15 items-center justify-center rounded bg-muted text-xs">
                        N/A
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground">
                          {item.variantName}: {item.variantValue}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.itemsSubtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                {order.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(order.shipping)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{address.fullName}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
              <p>{address.country}</p>
              <p className="mt-1">Phone: {address.phone}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.user.name || "N/A"}</p>
              <p className="text-muted-foreground">{order.user.email}</p>
              {order.user.phone && (
                <p className="text-muted-foreground">{order.user.phone}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                </Badge>
              </div>
              {order.payment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{order.payment.method ?? "N/A"}</span>
                  </div>
                  {order.payment.razorpayPaymentId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment ID</span>
                      <span className="font-mono text-xs">
                        {order.payment.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusUpdater
                orderId={order.id}
                currentStatus={order.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.map((t, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {i < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
