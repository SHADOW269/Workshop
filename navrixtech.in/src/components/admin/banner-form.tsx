"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { bannerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";

interface BannerData {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  position: string;
  order: number;
  isActive: boolean;
}

interface Props {
  children: ReactNode;
  banner?: BannerData;
}

export function BannerForm({ children, banner }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [image, setImage] = useState<string>(banner?.image ?? "");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      image: banner?.image ?? "",
      ctaLabel: banner?.ctaLabel ?? "",
      ctaLink: banner?.ctaLink ?? "",
      position: banner?.position ?? "home_hero",
      order: banner?.order ?? 0,
      isActive: banner?.isActive ?? true,
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImage(data.url);
      setValue("image", data.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    if (!image) {
      toast.error("Please upload an image");
      return;
    }
    startTransition(async () => {
      try {
        const method = banner ? "PUT" : "POST";
        const url = banner
          ? `/api/admin/banners/${banner.id}`
          : "/api/admin/banners";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, image }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed");
        }
        toast.success(banner ? "Banner updated" : "Banner created");
        setOpen(false);
        window.location.reload();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "New Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input {...register("subtitle")} />
          </div>
          <div className="space-y-2">
            <Label>Image *</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <Upload className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Upload image"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
            {image && (
              <p className="text-xs text-muted-foreground">
                Image uploaded ✓
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Label</Label>
              <Input {...register("ctaLabel")} placeholder="Shop Now" />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input {...register("ctaLink")} placeholder="/products" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <select
                {...register("position")}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="home_hero">Home Hero</option>
                <option value="home_secondary">Home Secondary</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                {...register("order", { valueAsNumber: true })}
              />
            </div>
          </div>
          <label className="flex items-center gap-3">
            <Checkbox
              checked={watch("isActive")}
              onCheckedChange={(c) => setValue("isActive", !!c)}
            />
            <span className="text-sm">Active</span>
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
