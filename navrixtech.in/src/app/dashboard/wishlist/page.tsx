"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist";
import { formatPrice, discountPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  brand: string | null;
};

export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = ids.join(",");

  useEffect(() => {
    let cancelled = false;

    if (!idsKey) {
      setProducts([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/products/by-ids?ids=${idsKey}`);
        const data = await res.json();
        if (!cancelled) setProducts(data.products ?? []);
      } catch {
        // keep empty list
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wishlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ids.length > 0
            ? `${ids.length} saved ${ids.length === 1 ? "item" : "items"}`
            : "Your saved items"}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full rounded-b-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ids.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Heart className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the heart on any product to save it here.
              </p>
            </div>
            <Button variant="gradient" asChild>
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Some saved products are no longer available.
            </p>
            <Button variant="outline" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const percent = discountPercent(
              product.price,
              product.compareAtPrice ?? 0
            );
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-secondary">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  {percent > 0 && (
                    <Badge variant="gradient" className="absolute left-2 top-2">
                      -{percent}%
                    </Badge>
                  )}
                  <button
                    onClick={() => toggle(product.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </button>
                </div>
                <CardHeader className="p-4">
                  <div className="space-y-1">
                    {product.brand && (
                      <p className="text-xs uppercase text-muted-foreground">
                        {product.brand}
                      </p>
                    )}
                    <CardTitle className="line-clamp-1 text-sm font-medium">
                      <Link
                        href={`/products/${product.slug}`}
                        className="hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice &&
                        product.compareAtPrice > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toggle(product.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
