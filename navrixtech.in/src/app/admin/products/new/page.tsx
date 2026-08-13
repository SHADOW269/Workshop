import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        children: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Product</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
