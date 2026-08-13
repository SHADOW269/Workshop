import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { brandSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const brand = await prisma.brand.create({
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
  return NextResponse.json({ brand }, { status: 201 });
}
