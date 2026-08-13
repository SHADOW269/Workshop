import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchSchema } from "@/lib/validators";
import ProductCard from "@/components/products/product-card";
import ProductFilters from "@/components/products/product-filters";
import ClientPagination from "@/components/products/client-pagination";
import SortSelect from "@/components/products/sort-select";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our collection of premium gaming peripherals, mechanical keyboards, mice, and desk accessories.",
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;
  const parsed = searchSchema.safeParse({
    q: raw.q ?? "",
    category: raw.category,
    brand: raw.brand,
    minPrice: raw.minPrice,
    maxPrice: raw.maxPrice,
    sort: raw.sort,
    page: raw.page ?? "1",
    view: raw.view ?? "grid",
  });

  const q = parsed.success ? parsed.data.q : "";
  const page = parsed.success ? parsed.data.page : 1;
  const sort = parsed.success ? parsed.data.sort ?? "newest" : "newest";
  const categoryId = parsed.success ? parsed.data.category : undefined;
  const brandSlug = parsed.success ? parsed.data.brand : undefined;
  const minPrice = parsed.success ? parsed.data.minPrice : undefined;
  const maxPrice = parsed.success ? parsed.data.maxPrice : undefined;

  let brandId: string | undefined;
  if (brandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    brandId = brand?.id;
  }

  let resolvedCategoryId: string | undefined;
  if (categoryId) {
    const cat = await prisma.category.findUnique({
      where: { slug: categoryId },
      select: { id: true },
    });
    resolvedCategoryId = cat?.id;
  }

  const searchQuery = q || " ";
  const { products, total } = await searchProducts(searchQuery, {
    categoryId: resolvedCategoryId,
    brandId,
    minPrice,
    maxPrice,
    sort,
    page,
    pageSize: 12,
  });

  const totalPages = Math.ceil(total / 12);

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const pageTitle = q ? `Search results for "${q}"` : "All Products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} product{total !== 1 ? "s" : ""} found
        </p>
        <div className="mt-4 flex items-center gap-3">
          <SortSelect currentSort={sort} />
        </div>
      </div>

      <div className="flex gap-8">
        <Suspense fallback={null}>
          <ProductFilters categories={categories} brands={brands} />
        </Suspense>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      compareAtPrice: product.compareAtPrice,
                      rating: 0,
                      ratingCount: 0,
                      isNewArrival: false,
                      isFeatured: product.isFeatured,
                      images: product.images,
                      brand: product.brand,
                      category: product.category,
                    }}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10">
                  <ClientPagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

async function searchProducts(
  query: string,
  opts: {
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const { searchProducts: sp } = await import("@/lib/search");
  return sp(query, opts);
}
