import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 1) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const results = await searchProducts(q, {
      categoryId: searchParams.get("category") ?? undefined,
      brandId: searchParams.get("brand") ?? undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      sort: searchParams.get("sort") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: 20,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
