"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice, discountPercent } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useUIStore } from "@/stores/ui";

export type ProductWithRelations = {
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
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
};

interface ProductCardProps {
  product: ProductWithRelations;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleCart = useUIStore((s) => s.toggleCart);

  const discount = discountPercent(product.price, product.compareAtPrice ?? 0);
  const primaryImage = product.images[0];
  const hoverImage = product.images[1];

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: primaryImage?.url ?? "",
      quantity: 1,
    });
    toggleCart();
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl",
          "glass transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          )}
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-500",
                "group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
          )}
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="absolute inset-0 object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
          )}
          {!primaryImage && (
            <div className="flex h-full items-center justify-center bg-muted/50">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1.5">
            {product.isNewArrival && (
              <Badge variant="gradient" className="text-[10px]">
                New
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full",
              "bg-background/80 backdrop-blur-sm transition-all duration-200",
              "hover:bg-background hover:scale-110",
              isWishlisted && "text-red-500"
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isWishlisted && "fill-current"
              )}
            />
          </button>

          {/* Quick add to cart */}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full p-2 transition-transform duration-300 group-hover:translate-y-0">
            <Button
              variant="gradient"
              size="sm"
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
          {product.brand && (
            <span className="text-xs text-muted-foreground">
              {product.brand.name}
            </span>
          )}
          <h3 className="line-clamp-1 text-sm font-medium sm:text-base">
            {product.name}
          </h3>

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(product.rating)
                      ? "fill-primary text-primary"
                      : "fill-transparent text-muted-foreground/30"
                  )}
                />
              ))}
              <span className="ml-0.5 text-xs text-muted-foreground">
                ({product.ratingCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto flex items-center gap-2 pt-1">
            <span className="text-base font-bold sm:text-lg">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-xl">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
