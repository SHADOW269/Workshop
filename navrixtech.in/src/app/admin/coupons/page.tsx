import { prisma } from "@/lib/prisma";
import { formatPrice, getPaginationParams } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Plus, Pencil } from "lucide-react";
import { CouponForm } from "@/components/admin/coupon-form";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminCouponsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.coupon.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <CouponForm>
          <Button>
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </CouponForm>
      </div>

      <Card>
        <CardContent className="pt-6">
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Ticket className="h-12 w-12" />
              <p>No coupons yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Code
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Value
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Min Order
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Usage
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Expiry
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const isExpired =
                      coupon.validUntil &&
                      new Date(coupon.validUntil) < new Date();
                    return (
                      <tr
                        key={coupon.id}
                        className="border-b border-border/50"
                      >
                        <td className="py-3 font-mono font-medium">
                          {coupon.code}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {coupon.type === "PERCENT" ? "Percent" : "Fixed"}
                        </td>
                        <td className="py-3 text-right">
                          {coupon.type === "PERCENT"
                            ? `${coupon.value}%`
                            : formatPrice(coupon.value)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {coupon.minOrder > 0
                            ? formatPrice(coupon.minOrder)
                            : "-"}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {coupon.usedCount}
                          {coupon.usageLimit
                            ? ` / ${coupon.usageLimit}`
                            : ""}
                        </td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={
                              isExpired || !coupon.isActive
                                ? "secondary"
                                : "default"
                            }
                          >
                            {isExpired
                              ? "Expired"
                              : coupon.isActive
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {coupon.validUntil
                            ? new Date(
                                coupon.validUntil
                              ).toLocaleDateString("en-IN")
                            : "No expiry"}
                        </td>
                        <td className="py-3 text-right">
                          <CouponForm coupon={coupon}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </CouponForm>
                        </td>
                      </tr>
                    );
                  })}
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
                    <a href={`/admin/coupons?page=${page - 1}`}>Previous</a>
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
                    <a href={`/admin/coupons?page=${page + 1}`}>Next</a>
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
