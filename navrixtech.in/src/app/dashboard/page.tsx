import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Heart,
  IndianRupee,
  Package,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { statusBadgeVariant } from "@/lib/status";

export const metadata = { title: "Dashboard" };

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userId = user.id!;

  const [totalOrders, pendingOrders, wishlistCount, spentAgg, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: "PENDING" } }),
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.order.aggregate({
        where: { userId, paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
      }),
    ]);

  const totalSpent = spentAgg._sum.total ?? 0;

  const stats = [
    { label: "Total Orders", value: String(totalOrders), icon: Package },
    {
      label: "Pending Orders",
      value: String(pendingOrders),
      icon: Clock,
    },
    { label: "Wishlist Items", value: String(wishlistCount), icon: Heart },
    {
      label: "Total Spent",
      value: formatPrice(totalSpent),
      icon: IndianRupee,
    },
  ];

  const quickLinks = [
    { label: "View Orders", href: "/dashboard/orders" },
    { label: "Wishlist", href: "/dashboard/wishlist" },
    { label: "Addresses", href: "/dashboard/addresses" },
    { label: "Edit Profile", href: "/dashboard/profile" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name ?? "there"} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders" className="flex items-center gap-1">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No orders yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When you place an order, it will show up here.
                </p>
              </div>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.items.reduce((n, i) => n + i.quantity, 0)} items
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
