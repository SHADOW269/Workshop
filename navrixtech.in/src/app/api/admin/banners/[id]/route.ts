import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { bannerSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.banner.update({
    where: { id },
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
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await prisma.banner.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
