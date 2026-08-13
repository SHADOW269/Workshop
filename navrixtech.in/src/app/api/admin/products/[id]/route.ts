import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { productSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description,
        sku: data.sku,
        brandId: data.brandId,
        categoryId: data.categoryId,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        warranty: data.warranty,
        weight: data.weight,
        features: body.features?.length ? body.features : [],
        specs: body.specs,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isBestSeller: data.isBestSeller,
        isNewArrival: data.isNewArrival,
      },
    });
    if (Array.isArray(body.images)) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: body.images.map((url: string, i: number) => ({
          productId: id,
          url,
          position: i,
        })),
      });
    }
  });

  revalidatePath("/products");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
