import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { sendShippingUpdate } from "@/lib/email";

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { user: true },
  });

  if (["SHIPPED", "DELIVERED"].includes(status) && order.user.email) {
    void sendShippingUpdate(
      order.user.email,
      order.orderNumber,
      status,
      order.trackingUrl ?? undefined
    );
  }

  return NextResponse.json({ ok: true });
}
