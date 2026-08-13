import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import Image from "next/image";
import { BrandForm } from "@/components/admin/brand-form";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Brands</h1>
        <BrandForm>
          <Button>
            <Plus className="h-4 w-4" />
            Add Brand
          </Button>
        </BrandForm>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No brands yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-lg font-bold">
                    {brand.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{brand.name}</span>
                    {!brand.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {brand._count.products} products
                  </p>
                </div>
                <BrandForm brand={brand}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </BrandForm>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
