import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { couponSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const data = parsed.data;

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder,
      maxDiscount: data.maxDiscount,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      usageLimit: data.usageLimit,
      isActive: data.isActive,
    },
  });

  revalidatePath("/cart");
  return NextResponse.json({ coupon }, { status: 201 });
}
