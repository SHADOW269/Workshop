import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { productSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const product = await prisma.product.create({
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
      features: body.features?.length ? body.features : undefined,
      specs: body.specs,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isBestSeller: data.isBestSeller,
      isNewArrival: data.isNewArrival,
      images: {
        create: (body.images as string[] | undefined)?.map((url, i) => ({
          url,
          position: i,
        })) ?? [],
      },
      inventory: {
        create: { stock: 0 },
      },
    },
  });

  revalidatePath("/products");
  revalidatePath("/");
  return NextResponse.json({ product }, { status: 201 });
}
