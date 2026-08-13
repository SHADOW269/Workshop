"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import {
  categorySchema,
  brandSchema,
  bannerSchema,
  couponSchema,
  settingsSchema,
} from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  await requireAdmin();

  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { stock: { lte: 5 } },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      take: 10,
    }),
  ]);

  return {
    revenue: totalRevenue._sum.total ?? 0,
    orders: totalOrders,
    customers: totalCustomers,
    products: totalProducts,
    recentOrders,
    lowStockProducts,
  };
}

// ============ Categories ============

export async function createCategory(data: unknown) {
  await requireAdmin();
  const parsed = categorySchema.parse(data);

  const category = await prisma.category.create({
    data: {
      ...parsed,
      slug: parsed.slug || slugify(parsed.name),
    },
  });

  revalidatePath("/admin/categories");
  return category;
}

export async function updateCategory(id: string, data: unknown) {
  await requireAdmin();
  const parsed = categorySchema.partial().parse(data);

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...parsed,
      slug: parsed.name ? slugify(parsed.name) : undefined,
    },
  });

  revalidatePath("/admin/categories");
  return category;
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true };
}

// ============ Brands ============

export async function createBrand(data: unknown) {
  await requireAdmin();
  const parsed = brandSchema.parse(data);

  const brand = await prisma.brand.create({
    data: {
      ...parsed,
      slug: parsed.slug || slugify(parsed.name),
    },
  });

  revalidatePath("/admin/brands");
  return brand;
}

export async function updateBrand(id: string, data: unknown) {
  await requireAdmin();
  const parsed = brandSchema.partial().parse(data);

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...parsed,
      slug: parsed.name ? slugify(parsed.name) : undefined,
    },
  });

  revalidatePath("/admin/brands");
  return brand;
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
  return { success: true };
}

// ============ Banners ============

export async function createBanner(data: unknown) {
  await requireAdmin();
  const parsed = bannerSchema.parse(data);
  const banner = await prisma.banner.create({ data: parsed });
  revalidatePath("/admin/banners");
  return banner;
}

export async function updateBanner(id: string, data: unknown) {
  await requireAdmin();
  const parsed = bannerSchema.partial().parse(data);
  const banner = await prisma.banner.update({ where: { id }, data: parsed });
  revalidatePath("/admin/banners");
  return banner;
}

export async function deleteBanner(id: string) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  return { success: true };
}

// ============ Coupons ============

export async function createCoupon(data: unknown) {
  await requireAdmin();
  const parsed = couponSchema.parse(data);

  const coupon = await prisma.coupon.create({
    data: {
      ...parsed,
      validFrom: parsed.validFrom ? new Date(parsed.validFrom) : undefined,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : undefined,
    },
  });

  revalidatePath("/admin/coupons");
  return coupon;
}

export async function updateCoupon(id: string, data: unknown) {
  await requireAdmin();
  const parsed = couponSchema.partial().parse(data);

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...parsed,
      validFrom: parsed.validFrom ? new Date(parsed.validFrom) : undefined,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : undefined,
    },
  });

  revalidatePath("/admin/coupons");
  return coupon;
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function applyCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid coupon code");
  }

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new Error("Coupon not yet valid");
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    throw new Error("Coupon has expired");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  if (subtotal < coupon.minOrder) {
    throw new Error(
      `Minimum order value is ₹${(coupon.minOrder / 100).toFixed(0)}`
    );
  }

  let discount: number;
  if (coupon.type === "PERCENT") {
    discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(coupon.value, subtotal);
  }

  return { discount, coupon };
}

// ============ Reviews ============

export async function updateReviewStatus(
  id: string,
  status: "APPROVED" | "REJECTED"
) {
  await requireAdmin();

  const review = await prisma.review.update({
    where: { id },
    data: { status },
  });

  const stats = await prisma.review.aggregate({
    where: { productId: review.productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: stats._avg.rating ?? 0,
      ratingCount: stats._count.rating,
    },
  });

  revalidatePath("/admin/reviews");
  return review;
}

// ============ Newsletter ============

export async function getSubscribers() {
  await requireAdmin();
  return prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// ============ Contact Messages ============

export async function getContactMessages() {
  await requireAdmin();
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function markMessageRead(id: string) {
  await requireAdmin();
  await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
  revalidatePath("/admin/messages");
  return { success: true };
}

// ============ Settings ============

export async function updateSettings(data: Record<string, unknown>) {
  await requireAdmin();
  const parsed = settingsSchema.parse(data);

  const operations = Object.entries(parsed).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    })
  );

  await Promise.all(operations);

  revalidatePath("/admin/settings");
  return { success: true };
}
