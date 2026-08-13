import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductEditForm } from "@/components/admin/product-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });

  if (!product) notFound();

  const serialized = {
    ...product,
    features: Array.isArray(product.features)
      ? (product.features as string[])
      : [],
    specs: (product.specs as Record<string, string>) ?? {},
  };

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
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <ProductEditForm product={serialized} categories={categories} brands={brands} />
    </div>
  );
}
