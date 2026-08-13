import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = await params;
    const body = await req.json();
    const data = reviewSchema.parse(body);

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already reviewed this product" },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title,
        body: data.body,
      },
    });

    const stats = await prisma.review.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating ?? 0,
        ratingCount: stats._count.rating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
