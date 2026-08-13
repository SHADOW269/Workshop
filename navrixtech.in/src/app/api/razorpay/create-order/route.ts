import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { generateOrderNumber } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from "@/lib/constants";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    line1: z.string().min(5),
    line2: z.string().nullable().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().length(6),
    country: z.string().default("India"),
  }),
  shipping: z.number().int().min(0).optional(),
  couponCode: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createOrderSchema.parse(await req.json());
    const productIds = [...new Set(body.items.map((i) => i.productId))];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more items are no longer available" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const variantIds = body.items
      .map((i) => i.variantId)
      .filter((v): v is string => Boolean(v));
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const inventory = await prisma.inventory.findMany({
      where: { productId: { in: productIds } },
    });

    const orderItems: {
      productId: string;
      productName: string;
      productSlug: string;
      variantName: string | null;
      variantValue: string | null;
      image: string | null;
      unitPrice: number;
      quantity: number;
      total: number;
    }[] = [];
    let itemsSubtotal = 0;

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: "One or more items are no longer available" },
          { status: 400 }
        );
      }

      const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
      if (item.variantId && !variant) {
        return NextResponse.json(
          { error: `Variant for ${product.name} is unavailable` },
          { status: 400 }
        );
      }

      const stockRows = inventory.filter(
        (inv) =>
          inv.productId === item.productId &&
          (inv.variantId ?? null) === (item.variantId ?? null)
      );
      if (stockRows.length > 0) {
        const available = stockRows.reduce((sum, inv) => sum + inv.stock, 0);
        if (available < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }
      }

      const unitPrice = variant?.price ?? product.price;
      itemsSubtotal += unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: variant?.name ?? null,
        variantValue: variant?.value ?? null,
        image: product.images[0]?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        total: unitPrice * item.quantity,
      });
    }

    const freeEligible = itemsSubtotal >= FREE_SHIPPING_THRESHOLD;
    const shipping = freeEligible
      ? body.shipping === FLAT_SHIPPING_RATE
        ? FLAT_SHIPPING_RATE
        : 0
      : FLAT_SHIPPING_RATE;

    let discount = 0;
    let couponId: string | null = null;

    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: body.couponCode.trim().toUpperCase() },
      });
      const now = new Date();
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.validFrom || coupon.validFrom <= now) &&
        (!coupon.validUntil || coupon.validUntil >= now) &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        itemsSubtotal >= coupon.minOrder
      ) {
        couponId = coupon.id;
        discount =
          coupon.type === "PERCENT"
            ? Math.min(
                Math.round((itemsSubtotal * coupon.value) / 100),
                coupon.maxDiscount ?? itemsSubtotal
              )
            : Math.min(coupon.value, itemsSubtotal);
      }
    }

    const total = Math.max(0, itemsSubtotal - discount + shipping);
    const orderNumber = generateOrderNumber();

    const razorpayOrder = await createRazorpayOrder(total / 100, orderNumber);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING",
          paymentStatus: "PENDING",
          couponId,
          itemsSubtotal,
          discount,
          shipping,
          tax: 0,
          total,
          shippingAddress: body.address,
          items: { create: orderItems },
        },
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          gateway: "razorpay",
          razorpayOrderId: razorpayOrder.id,
          amount: total,
          currency: "INR",
          status: "PENDING",
        },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.userCoupon.upsert({
          where: { userId_couponId: { userId, couponId } },
          create: { userId, couponId },
          update: {},
        });
      }

      return created;
    });

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
      orderId: razorpayOrder.id,
      amount: total,
      dbOrderId: order.id,
      orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
