import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, getPaginationParams, truncate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Package } from "lucide-react";
import Image from "next/image";
import { ProductFilters } from "@/components/admin/product-filters";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);
  const search = params.search || "";
  const categoryId = params.category || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        images: { take: 1, orderBy: { position: "asc" } },
        brand: { select: { name: true } },
        category: { select: { name: true } },
        inventory: { select: { stock: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductFilters categories={categories} />

      <Card>
        <CardContent className="pt-6">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Package className="h-12 w-12" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Brand
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const totalStock = product.inventory.reduce(
                      (sum, inv) => sum + inv.stock,
                      0
                    );
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border/50"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs">
                                N/A
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {truncate(product.name, 40)}
                              </p>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground">
                                  {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {product.brand?.name ?? "-"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {product.category.name}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatPrice(product.price)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={
                              totalStock < 5
                                ? "text-destructive font-medium"
                                : ""
                            }
                          >
                            {totalStock}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
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
        <PaginationServer
          page={page}
          totalPages={totalPages}
          basePath="/admin/products"
          params={{ search, category: categoryId }}
        />
      )}
    </div>
  );
}

function PaginationServer({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string>;
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="flex justify-center">
      <nav aria-label="pagination">
        <ul className="flex items-center gap-1">
          {page > 1 && (
            <li>
              <Button variant="outline" size="sm" asChild>
                <Link href={buildHref(page - 1)}>Previous</Link>
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
                <Link href={buildHref(page + 1)}>Next</Link>
              </Button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
