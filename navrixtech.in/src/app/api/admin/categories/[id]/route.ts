import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { categorySchema } from "@/lib/validators";
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
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
      description: data.description,
      image: data.image,
      icon: data.icon,
      parentId: data.parentId,
      order: data.order,
      isActive: data.isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete category with ${count} product(s)` },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json({ ok: true });
}
