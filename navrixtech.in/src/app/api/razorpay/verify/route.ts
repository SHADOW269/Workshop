import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: "asc" } },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const itemsSubtotal = cart.items.reduce(
      (sum, item) =>
        sum + (item.variant?.price ?? item.product.price) * item.quantity,
      0
    );

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        itemsSubtotal,
        total: itemsSubtotal,
        shippingAddress: {},
        items: {
          create: cart.items.map((item) => {
            const price = item.variant?.price ?? item.product.price;
            return {
              productId: item.product.id,
              productName: item.product.name,
              productSlug: item.product.slug,
              variantName: item.variant?.name ?? null,
              variantValue: item.variant?.value ?? null,
              image: item.product.images[0]?.url ?? null,
              unitPrice: price,
              quantity: item.quantity,
              total: price * item.quantity,
            };
          }),
        },
        payment: {
          create: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: itemsSubtotal,
            status: "PAID",
          },
        },
      },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      sendOrderConfirmation(user.email, orderNumber, itemsSubtotal).catch(
        () => {}
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
