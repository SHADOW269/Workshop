import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      brand: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      image: p.images[0]?.url ?? null,
      brand: p.brand?.name ?? null,
    })),
  });
}
