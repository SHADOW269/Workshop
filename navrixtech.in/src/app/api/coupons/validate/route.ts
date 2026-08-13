import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applyCouponSchema } from "@/lib/validators";

const validateSchema = applyCouponSchema.extend({
  code: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = validateSchema.parse(await req.json());

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    const now = new Date();
    const valid =
      coupon &&
      coupon.isActive &&
      (!coupon.validFrom || coupon.validFrom <= now) &&
      (!coupon.validUntil || coupon.validUntil >= now) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      subtotal >= coupon.minOrder;

    if (!coupon || !valid) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    const discount =
      coupon.type === "PERCENT"
        ? Math.min(
            Math.round((subtotal * coupon.value) / 100),
            coupon.maxDiscount ?? subtotal
          )
        : Math.min(coupon.value, subtotal);

    return NextResponse.json({
      code: coupon.code,
      discount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
