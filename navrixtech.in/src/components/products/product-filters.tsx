"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type FilterCategory = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

type FilterBrand = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

interface ProductFiltersProps {
  categories: FilterCategory[];
  brands: FilterBrand[];
}

export default function ProductFilters({
  categories,
  brands,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeBrand = searchParams.get("brand") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const applyPriceRange = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (localMinPrice) params.set("minPrice", localMinPrice);
    else params.delete("minPrice");
    if (localMaxPrice) params.set("maxPrice", localMaxPrice);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [localMinPrice, localMaxPrice, router, searchParams]);

  const resetFilters = useCallback(() => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const hasActiveFilters = activeCategory || activeBrand || minPrice || maxPrice;

  const content = (
    <div className="space-y-6">
      {/* Active filters */}
      {hasActiveFilters && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Active Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={resetFilters}
            >
              Reset all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategory && (
              <Badge
                label={categories.find((c) => c.slug === activeCategory)?.name ?? activeCategory}
                onRemove={() => updateParams("category", "")}
              />
            )}
            {activeBrand && (
              <Badge
                label={brands.find((b) => b.slug === activeBrand)?.name ?? activeBrand}
                onRemove={() => updateParams("brand", "")}
              />
            )}
            {minPrice && (
              <Badge
                label={`Min: ₹${minPrice}`}
                onRemove={() => {
                  setLocalMinPrice("");
                  updateParams("minPrice", "");
                }}
              />
            )}
            {maxPrice && (
              <Badge
                label={`Max: ₹${maxPrice}`}
                onRemove={() => {
                  setLocalMaxPrice("");
                  updateParams("maxPrice", "");
                }}
              />
            )}
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold">Category</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={activeCategory === category.slug}
                  onCheckedChange={() =>
                    updateParams(
                      "category",
                      activeCategory === category.slug ? "" : category.slug
                    )
                  }
                />
                <span className="flex-1">{category.name}</span>
                {category._count && (
                  <span className="text-xs text-muted-foreground">
                    {category._count.products}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold">Brand</h4>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={activeBrand === brand.slug}
                  onCheckedChange={() =>
                    updateParams(
                      "brand",
                      activeBrand === brand.slug ? "" : brand.slug
                    )
                  }
                />
                <span className="flex-1">{brand.name}</span>
                {brand._count && (
                  <span className="text-xs text-muted-foreground">
                    {brand._count.products}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">Price Range</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            className="h-9 text-sm"
            min="0"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            className="h-9 text-sm"
            min="0"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={applyPriceRange}
        >
          Apply Price
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <div className="sticky top-24">
          <h3 className="mb-4 text-lg font-semibold">Filters</h3>
          {content}
        </div>
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="sticky top-16 z-30 mb-4 flex items-center gap-2 border-b border-border bg-background/95 py-3 backdrop-blur-sm lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{content}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function Badge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-primary/20"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
