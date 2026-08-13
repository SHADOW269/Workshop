import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { bannerSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const banner = await prisma.banner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      image: data.image,
      ctaLabel: data.ctaLabel,
      ctaLink: data.ctaLink,
      position: data.position,
      order: data.order,
      isActive: data.isActive,
    },
  });

  revalidatePath("/");
  return NextResponse.json({ banner }, { status: 201 });
}
