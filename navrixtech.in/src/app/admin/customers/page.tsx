import { prisma } from "@/lib/prisma";
import { formatPrice, getPaginationParams } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { CustomerFilters } from "@/components/admin/customer-filters";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);
  const search = params.search || "";

  const where: Record<string, unknown> = { role: "CUSTOMER" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: { select: { total: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>

      <CustomerFilters />

      <Card>
        <CardContent className="pt-6">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Users className="h-12 w-12" />
              <p>No customers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Phone
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Orders
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Total Spent
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const totalSpent = customer.orders.reduce(
                      (sum, o) => sum + o.total,
                      0
                    );
                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-border/50"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {customer.name
                                ? customer.name[0].toUpperCase()
                                : customer.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">
                                {customer.name || "No name"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {customer.phone ?? "-"}
                        </td>
                        <td className="py-3 text-right">
                          {customer._count.orders}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatPrice(totalSpent)}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
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
                    <a
                      href={`/admin/customers?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                    >
                      Previous
                    </a>
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
                    <a
                      href={`/admin/customers?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                    >
                      Next
                    </a>
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
