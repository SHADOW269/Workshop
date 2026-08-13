import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    lowStockProducts,
    bestSellingProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.inventory.findMany({
      where: { stock: { lt: 5 } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { soldCount: "desc" },
      select: { name: true, soldCount: true, price: true, slug: true },
    }),
  ]);

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue._sum.total ?? 0),
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Total Customers",
      value: totalCustomers.toString(),
      icon: Users,
    },
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestSellingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {bestSellingProducts.map((p, i) => (
                  <div key={p.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{p.soldCount} sold</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All products are well stocked.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{inv.product.name}</span>
                    <Badge
                      variant={inv.stock === 0 ? "destructive" : "secondary"}
                    >
                      {inv.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
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
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Payment
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">{order.orderNumber}</td>
                      <td className="py-3 text-muted-foreground">
                        {order.user.name || order.user.email}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary">
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
