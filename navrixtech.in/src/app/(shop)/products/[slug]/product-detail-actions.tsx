"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useUIStore } from "@/stores/ui";

type Variant = {
  id: string;
  name: string;
  value: string;
  price: number | null;
};

interface ProductDetailActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    variants: Variant[];
  };
}

export default function ProductDetailActions({
  product,
}: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );

  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useUIStore((s) => s.toggleCart);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.has(product.id));
  const router = useRouter();

  const activePrice = selectedVariant?.price ?? product.price;
  const totalPrice = activePrice * quantity;

  // Group variants by name (e.g., "Color", "Switch Type")
  const variantGroups = product.variants.reduce<Record<string, Variant[]>>(
    (acc, v) => {
      if (!acc[v.name]) acc[v.name] = [];
      acc[v.name].push(v);
      return acc;
    },
    {}
  );

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: activePrice,
      compareAtPrice: product.compareAtPrice,
      image: product.image,
      variant: selectedVariant
        ? { id: selectedVariant.id, name: selectedVariant.name, value: selectedVariant.value }
        : undefined,
      quantity,
    });
    toast.success("Added to cart!");
    toggleCart();
  }

  function handleBuyNow() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: activePrice,
      compareAtPrice: product.compareAtPrice,
      image: product.image,
      variant: selectedVariant
        ? { id: selectedVariant.id, name: selectedVariant.name, value: selectedVariant.value }
        : undefined,
      quantity,
    });
    router.push("/checkout");
  }

  return (
    <div className="space-y-5">
      {/* Variant selectors */}
      {Object.entries(variantGroups).map(([name, variants]) => (
        <div key={name}>
          <label className="mb-2 block text-sm font-medium">
            {name}:{" "}
            <span className="text-primary">
              {selectedVariant?.name === name ? selectedVariant.value : variants[0].value}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-all",
                  selectedVariant?.id === variant.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {variant.value}
                {variant.price && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({formatPrice(variant.price)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div>
        <label className="mb-2 block text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex h-10 w-12 items-center justify-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="gradient"
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </Button>
        <Button
          variant="default"
          size="lg"
          className="flex-1"
          onClick={handleBuyNow}
        >
          <Zap className="h-5 w-5" />
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => toggleWishlist(product.id)}
          className={cn(isWishlisted && "text-red-500 border-red-500/30")}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
        </Button>
      </div>
    </div>
  );
}
