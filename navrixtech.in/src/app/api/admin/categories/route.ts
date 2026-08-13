import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { categorySchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const category = await prisma.category.create({
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
  return NextResponse.json({ category }, { status: 201 });
}
