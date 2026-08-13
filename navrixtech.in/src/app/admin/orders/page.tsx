import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, getPaginationParams } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { OrderFilters } from "@/components/admin/order-filters";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);
  const search = params.search || "";
  const status = params.status || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.orderNumber = { contains: search, mode: "insensitive" };
  }
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      <OrderFilters />

      <Card>
        <CardContent className="pt-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12" />
              <p>No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Order
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Items
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Payment
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">{order.orderNumber}</td>
                      <td className="py-3 text-muted-foreground">
                        {order.user.name || order.user.email}
                      </td>
                      <td className="py-3 text-right">
                        {order.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant="outline">
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant="secondary">
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav aria-label="pagination">
            <ul className="flex items-center gap-1">
              {page > 1 && (
                <li>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/orders?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        ...(status ? { status } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                    >
                      Previous
                    </Link>
                  </Button>
                </li>
              )}
              <li>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </li>
              {page < totalPages && (
                <li>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/orders?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        ...(status ? { status } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                    >
                      Next
                    </Link>
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
