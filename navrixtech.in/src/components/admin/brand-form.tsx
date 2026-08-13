"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { brandSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface BrandData {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  banner?: string | null;
  description?: string | null;
  isActive?: boolean;
}

interface Props {
  children: ReactNode;
  brand?: BrandData;
}

export function BrandForm({ children, brand }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [logo, setLogo] = useState<string>(brand?.logo ?? "");
  const [banner, setBanner] = useState<string>(brand?.banner ?? "");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      isActive: brand?.isActive ?? true,
    },
  });

  const handleUpload = async (file: File, field: "logo" | "banner") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (field === "logo") setLogo(data.url);
      else setBanner(data.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const method = brand ? "PUT" : "POST";
        const url = brand
          ? `/api/admin/brands/${brand.id}`
          : "/api/admin/brands";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, logo, banner }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed");
        }
        toast.success(brand ? "Brand updated" : "Brand created");
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
          <DialogTitle>{brand ? "Edit Brand" : "New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <Upload className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Upload logo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "logo");
                }}
              />
            </label>
            {logo && (
              <p className="text-xs text-muted-foreground">Logo uploaded ✓</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Banner</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <Upload className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Upload banner"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "banner");
                }}
              />
            </label>
            {banner && (
              <p className="text-xs text-muted-foreground">Banner uploaded ✓</p>
            )}
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
