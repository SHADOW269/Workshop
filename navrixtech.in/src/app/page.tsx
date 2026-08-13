import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import HeroBanner from "@/components/home/hero-banner";
import CategoriesSection from "@/components/home/categories-section";
import FeaturedProducts from "@/components/home/featured-products";
import NewArrivals from "@/components/home/new-arrivals";
import BestSellers from "@/components/home/best-sellers";
import BrandsSection from "@/components/home/brands-section";
import WhyNavrix from "@/components/home/why-navrix";
import ReviewsSection from "@/components/home/reviews-section";
import Newsletter from "@/components/home/newsletter";
import type { ProductWithRelations } from "@/components/products/product-card";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Premium Gaming Peripherals & Electronics`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Premium Gaming Peripherals & Electronics`,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

function toProductCard(p: {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  ratingCount: number;
  isNewArrival: boolean;
  isFeatured: boolean;
  images: { url: string; alt: string | null }[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}): ProductWithRelations {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    rating: p.rating,
    ratingCount: p.ratingCount,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    images: p.images,
    brand: p.brand,
    category: p.category,
  };
}

export default async function HomePage() {
  const [
    featuredProducts,
    newArrivals,
    bestSellers,
    categories,
    brands,
    banners,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { soldCount: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        products: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: { select: { products: true } },
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.brand.findMany({
      where: {
        isActive: true,
        products: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
      take: 12,
    }),
    prisma.banner.findMany({
      where: { isActive: true, position: "home_hero" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        image: true,
        ctaLabel: true,
        ctaLink: true,
      },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div>
      <HeroBanner
        banners={banners.map((b) => ({
          ...b,
          subtitle: b.subtitle ?? null,
          ctaLabel: b.ctaLabel ?? null,
          ctaLink: b.ctaLink ?? null,
        }))}
      />
      <CategoriesSection categories={categories} />
      <FeaturedProducts
        products={featuredProducts.map(toProductCard)}
      />
      <NewArrivals products={newArrivals.map(toProductCard)} />
      <BestSellers products={bestSellers.map(toProductCard)} />
      <BrandsSection brands={brands} />
      <WhyNavrix />
      <ReviewsSection />
      <Newsletter />
    </div>
  );
}
