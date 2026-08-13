import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const existingPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: "PAID", method: payment.method },
        });

        await prisma.order.update({
          where: { id: existingPayment.orderId },
          data: { paymentStatus: "PAID", status: "CONFIRMED" },
        });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      const existingPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: "FAILED" },
        });

        await prisma.order.update({
          where: { id: existingPayment.orderId },
          data: { paymentStatus: "FAILED", status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
