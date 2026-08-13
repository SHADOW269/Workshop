"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { productSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Upload, X, Plus } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string | null;
  categoryId: string;
  brandId: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  warranty: string | null;
  weight: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  images: { id: string; url: string; position: number }[];
  features: string[] | null;
  specs: Record<string, string> | null;
}

interface Category {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
}

interface Brand {
  id: string;
  name: string;
}

interface Props {
  product: Product;
  categories: Category[];
  brands: Brand[];
}

export function ProductEditForm({ product, categories, brands }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(
    product.images.map((img) => img.url)
  );
  const [features, setFeatures] = useState<string[]>(
    (product.features as string[]) || []
  );
  const [featureInput, setFeatureInput] = useState("");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    product.specs
      ? Object.entries(product.specs).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      : []
  );
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      sku: product.sku ?? "",
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      price: product.price / 100,
      compareAtPrice: product.compareAtPrice
        ? product.compareAtPrice / 100
        : undefined,
      costPrice: product.costPrice ? product.costPrice / 100 : undefined,
      warranty: product.warranty ?? "",
      weight: product.weight ?? undefined,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImages((prev) => [...prev, data.url]);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures((prev) => [...prev, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const addSpec = () => {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateSpec = (index: number, field: "key" | "value", val: string) => {
    setSpecs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const onSubmit = (data: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            price: Math.round(Number(data.price) * 100),
            compareAtPrice: data.compareAtPrice
              ? Math.round(Number(data.compareAtPrice) * 100)
              : null,
            costPrice: data.costPrice
              ? Math.round(Number(data.costPrice) * 100)
              : null,
            images,
            features,
            specs: specs.reduce(
              (acc, s) => {
                if (s.key) acc[s.key] = s.value;
                return acc;
              },
              {} as Record<string, string>
            ),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update product");
        }
        toast.success("Product updated");
        router.push("/admin/products");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update product");
      }
    });
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted");
      router.push("/admin/products");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category *</Label>
              <select
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {c.children?.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <select
                {...register("brandId")}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare At Price (₹)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (₹)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                {...register("costPrice", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </label>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <Image
                    src={url}
                    alt={`Image ${i + 1}`}
                    width={100}
                    height={100}
                    className="h-24 w-24 rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addFeature}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {features.length > 0 && (
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{f}</span>
                  <button
                    type="button"
                    onClick={() => setFeatures((prev) => prev.filter((_, j) => j !== i))}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Specifications
            <Button type="button" variant="secondary" size="sm" onClick={addSpec}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Key"
                value={spec.key}
                onChange={(e) => updateSpec(i, "key", e.target.value)}
              />
              <Input
                placeholder="Value"
                value={spec.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSpecs((prev) => prev.filter((_, j) => j !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["isActive", "Active"],
              ["isFeatured", "Featured"],
              ["isBestSeller", "Best Seller"],
              ["isNewArrival", "New Arrival"],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-md border border-border p-3"
              >
                <Checkbox
                  checked={watch(key) as boolean}
                  onCheckedChange={(checked) => setValue(key, !!checked)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              Delete Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All data including images, variants,
                and inventory will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
