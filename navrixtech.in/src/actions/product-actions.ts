"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createProduct(data: unknown) {
  try {
    await requireAdmin();
    const parsed = productSchema.parse(data);

    const slug = parsed.slug || slugify(parsed.name);
    const { features, ...rest } = parsed;

    const product = await prisma.product.create({
      data: {
        ...rest,
        slug,
        specs: features ? { features } : undefined,
        images: {
          create: (data as { images?: { url: string; alt?: string; position?: number }[] }).images?.map(
            (img, i) => ({
              url: img.url,
              alt: img.alt,
              position: img.position ?? i,
            })
          ) ?? [],
        },
      },
    });

    const variants = (data as { variants?: { name: string; value: string; price?: number; sku?: string; image?: string }[] }).variants;
    if (variants?.length) {
      await prisma.productVariant.createMany({
        data: variants.map((v, i) => ({
          productId: product.id,
          name: v.name,
          value: v.value,
          price: v.price,
          sku: v.sku,
          image: v.image,
          position: i,
        })),
      });
    }

    await prisma.inventory.create({
      data: { productId: product.id, stock: (data as { stock?: number }).stock ?? 0 },
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");

    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        throw error;
      }
    }
    console.error("Create product error:", error);
    throw new Error("Failed to create product");
  }
}

export async function updateProduct(id: string, data: unknown) {
  try {
    await requireAdmin();
    const parsed = productSchema.partial().parse(data);

    const slug = parsed.name ? slugify(parsed.name) : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...parsed,
        slug,
      },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/admin/products");

    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        throw error;
      }
    }
    console.error("Update product error:", error);
    throw new Error("Failed to update product");
  }
}

export async function deleteProduct(id: string) {
  try {
    await requireAdmin();

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/products");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        throw error;
      }
    }
    console.error("Delete product error:", error);
    throw new Error("Failed to delete product");
  }
}

type GetProductsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sort?: string;
};

export async function getProducts(opts: GetProductsOptions = {}) {
  const {
    page = 1,
    pageSize = 12,
    search,
    categoryId,
    brandId,
    isActive,
    isFeatured,
    sort,
  } = opts;

  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (isActive !== undefined) where.isActive = isActive;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;

  let orderBy: Record<string, string>;
  switch (sort) {
    case "price-low":
      orderBy = { price: "asc" };
      break;
    case "price-high":
      orderBy = { price: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "best-selling":
      orderBy = { soldCount: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      brand: true,
      category: true,
      inventory: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return product;
}
