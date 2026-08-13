import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, discountPercent, cn } from "@/lib/utils";
import ProductGallery from "@/components/products/product-gallery";
import ReviewSection from "@/components/products/review-section";
import ProductCard from "@/components/products/product-card";
import ProductDetailActions from "./product-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Shield,
  RotateCcw,
  Package,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      price: true,
      images: { take: 1, select: { url: true } },
    },
  });

  if (!product) return { title: "Product Not Found" };

  const desc = product.description.slice(0, 160);

  return {
    title: product.name,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images: product.images[0]
        ? [{ url: product.images[0].url, width: 800, height: 800 }]
        : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      brand: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { position: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const discount = discountPercent(
    product.price,
    product.compareAtPrice ?? 0
  );

  // Related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      images: { take: 2, orderBy: { position: "asc" } },
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
    take: 4,
    orderBy: { rating: "desc" },
  });

  const reviews = product.reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    sku: product.sku,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.ratingCount,
          }
        : undefined,
  };

  const specs = product.specs as Record<string, string> | null;
  const features = product.features as string[] | null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        {/* Product top section */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <ProductGallery
            images={product.images.map((img) => ({
              url: img.url,
              alt: img.alt,
            }))}
          />

          {/* Info */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="mb-3 flex items-center gap-2">
              {product.isNewArrival && (
                <Badge variant="gradient" className="text-xs">New</Badge>
              )}
              {discount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {discount}% OFF
                </Badge>
              )}
            </div>

            {/* Brand */}
            {product.brand && (
              <Link
                href={`/products?brand=${product.brand.slug}`}
                className="mb-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {product.brand.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            {product.ratingCount > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-sm",
                        i < Math.round(product.rating)
                          ? "text-primary"
                          : "text-muted-foreground/30"
                      )}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.ratingCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    Save {formatPrice(product.compareAtPrice - product.price)}
                  </Badge>
                </>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Description */}
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Variants + Actions (client component) */}
            <ProductDetailActions
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                image: product.images[0]?.url ?? "",
                variants: product.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  value: v.value,
                  price: v.price,
                })),
              }}
            />

            <Separator className="my-6" />

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck, text: "Free shipping over ₹999" },
                { icon: Shield, text: "Secure payments" },
                { icon: RotateCcw, text: "Easy 7-day returns" },
                { icon: Package, text: product.warranty ?? "Standard warranty" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({product.reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
                <p>{product.description}</p>
                {features && features.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-base font-semibold text-foreground">
                      Key Features
                    </h3>
                    <ul className="space-y-1">
                      {features.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              {specs && Object.keys(specs).length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(specs).map(([key, value], i) => (
                        <tr
                          key={key}
                          className={cn(
                            "border-b border-border/50 last:border-0",
                            i % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                          )}
                        >
                          <td className="px-4 py-3 font-medium">{key}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specifications available for this product.
                </p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewSection
                productId={product.id}
                reviews={reviews}
                averageRating={product.rating}
                totalReviews={product.ratingCount}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: p.price,
                    compareAtPrice: p.compareAtPrice,
                    rating: p.rating,
                    ratingCount: p.ratingCount,
                    isNewArrival: p.isNewArrival,
                    isFeatured: p.isFeatured,
                    images: p.images.map((img) => ({
                      url: img.url,
                      alt: img.alt,
                    })),
                    brand: p.brand,
                    category: p.category,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
