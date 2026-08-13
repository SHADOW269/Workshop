import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id }, data: { status } });
    if (status === "APPROVED") {
      const review = await tx.review.findUnique({ where: { id } });
      if (review) {
        const agg = await tx.review.aggregate({
          where: { productId: review.productId, status: "APPROVED" },
          _avg: { rating: true },
          _count: { id: true },
        });
        await tx.product.update({
          where: { id: review.productId },
          data: {
            rating: agg._avg.rating ?? 0,
            ratingCount: agg._count.id,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
