import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, getPaginationParams } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { statusBadgeVariant } from "@/lib/status";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 10;

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { page, skip } = getPaginationParams({
    page: params.page,
    pageSize: String(PAGE_SIZE),
  });
  const userId = user.id!;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/dashboard/orders${p > 1 ? `?page=${p}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Package className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No orders yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your orders will appear here once you place one.
              </p>
            </div>
            <Button variant="gradient" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="hidden md:block">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden grid-cols-[1fr_120px_120px_120px] gap-4 border-b px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <span>Order</span>
                <span>Items</span>
                <span>Total</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-border">
                {orders.map((order) => {
                  const itemCount = order.items.reduce(
                    (n, i) => n + i.quantity,
                    0
                  );
                  return (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="grid grid-cols-2 items-center gap-4 px-6 py-4 transition-colors hover:bg-accent md:grid-cols-[1fr_120px_120px_120px]"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatPrice(order.total)}
                      </span>
                      <span className="justify-self-start">
                        <Badge variant={statusBadgeVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="flex items-center gap-1.5">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 opacity-50">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </span>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="flex items-center gap-1.5">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 opacity-50">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
