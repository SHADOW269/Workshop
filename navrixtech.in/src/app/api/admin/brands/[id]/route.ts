import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { brandSchema } from "@/lib/validators";
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
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
      logo: data.logo,
      banner: data.banner,
      description: data.description,
      isActive: data.isActive,
    },
  });

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

  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete brand with ${count} product(s)` },
      { status: 400 }
    );
  }
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
