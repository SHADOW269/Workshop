import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SearchOptions = {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
};

type SearchResult = {
  products: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    brandId: string | null;
    categoryId: string | null;
    images: {
      id: string;
      url: string;
      alt: string | null;
      isPrimary: boolean;
    }[];
    brand: {
      id: string;
      name: string;
      slug: string;
    } | null;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }[];
  total: number;
};

export async function searchProducts(
  query: string,
  opts: SearchOptions = {}
): Promise<SearchResult> {
  const {
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    sort = "relevance",
    page = 1,
    pageSize = 20,
  } = opts;

  const offset = (page - 1) * pageSize;
  const q = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`p."isActive" = true`,
    Prisma.sql`(p.name ILIKE ${q} OR p.description ILIKE ${q} OR b.name ILIKE ${q} OR c.name ILIKE ${q})`,
  ];

  if (categoryId) conditions.push(Prisma.sql`p."categoryId" = ${categoryId}`);
  if (brandId) conditions.push(Prisma.sql`p."brandId" = ${brandId}`);
  if (minPrice !== undefined) conditions.push(Prisma.sql`p.price >= ${minPrice}`);
  if (maxPrice !== undefined) conditions.push(Prisma.sql`p.price <= ${maxPrice}`);

  const where = Prisma.join(conditions, " AND ");

  let orderBy: Prisma.Sql;
  switch (sort) {
    case "price-low":
      orderBy = Prisma.sql`p.price ASC`;
      break;
    case "price-high":
      orderBy = Prisma.sql`p.price DESC`;
      break;
    case "newest":
      orderBy = Prisma.sql`p."createdAt" DESC`;
      break;
    case "best-selling":
      orderBy = Prisma.sql`p."soldCount" DESC`;
      break;
    case "rating":
      orderBy = Prisma.sql`p.rating DESC`;
      break;
    case "discount":
      orderBy = Prisma.sql`p."compareAtPrice" DESC NULLS LAST`;
      break;
    case "relevance":
    default:
      orderBy = Prisma.sql`
        CASE
          WHEN p.name ILIKE ${q} THEN 0
          WHEN p.description ILIKE ${q} THEN 1
          ELSE 2
        END ASC,
        p."isFeatured" DESC,
        p."createdAt" DESC
      `;
  }

  const countQuery = Prisma.sql`
    SELECT COUNT(*)::int as count
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    WHERE ${where}
  `;

  const productsQuery = Prisma.sql`
    SELECT
      p.id, p.name, p.slug, p.description, p.price,
      p."compareAtPrice", p."isActive", p."isFeatured",
      p."createdAt", p."updatedAt", p."brandId", p."categoryId"
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;

  const [countResult, productRows] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>(countQuery),
    prisma.$queryRaw<Record<string, unknown>[]>(productsQuery),
  ]);

  const total = countResult[0]?.count ?? 0;
  const productIds = productRows.map((row) => row.id as string);

  let images: { id: string; productId: string; url: string; alt: string | null; position: number }[] = [];
  let brands: { id: string; name: string; slug: string }[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];

  if (productIds.length > 0) {
    [images, brands, categories] = await Promise.all([
      prisma.productImage.findMany({
        where: { productId: { in: productIds } },
        select: { id: true, productId: true, url: true, alt: true, position: true },
      }),
      prisma.brand.findMany({
        where: { id: { in: productRows.map((r) => r.brandId).filter(Boolean) as string[] } },
        select: { id: true, name: true, slug: true },
      }),
      prisma.category.findMany({
        where: { id: { in: productRows.map((r) => r.categoryId).filter(Boolean) as string[] } },
        select: { id: true, name: true, slug: true },
      }),
    ]);
  }

  const brandsMap = new Map(brands.map((b) => [b.id, b]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const products = productRows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    price: row.price as number,
    compareAtPrice: row.compareAtPrice as number | null,
    isActive: row.isActive as boolean,
    isFeatured: row.isFeatured as boolean,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    brandId: row.brandId as string | null,
    categoryId: row.categoryId as string | null,
    images: images
      .filter((i) => i.productId === row.id)
      .map((img) => ({ id: img.id, url: img.url, alt: img.alt, isPrimary: img.position === 0 })),
    brand: row.brandId ? brandsMap.get(row.brandId as string) ?? null : null,
    category: row.categoryId ? categoriesMap.get(row.categoryId as string) ?? null : null,
  }));

  return { products, total };
}
