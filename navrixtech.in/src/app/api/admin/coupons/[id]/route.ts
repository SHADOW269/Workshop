import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { couponSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.coupon.update({
    where: { id },
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      usageLimit: data.usageLimit,
      isActive: data.isActive,
    },
  });

  revalidatePath("/cart");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/cart");
  return NextResponse.json({ ok: true });
}
