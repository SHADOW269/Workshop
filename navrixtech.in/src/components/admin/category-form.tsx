"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validators";
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

interface CategoryData {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

interface Props {
  children: ReactNode;
  category?: CategoryData;
  parentId?: string;
}

export function CategoryForm({ children, category, parentId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      icon: category?.icon ?? "",
      parentId: category?.parentId ?? parentId ?? "",
      order: category?.order ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const method = category ? "PUT" : "POST";
        const url = category
          ? `/api/admin/categories/${category.id}`
          : "/api/admin/categories";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed");
        }
        toast.success(category ? "Category updated" : "Category created");
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
          <DialogTitle>
            {category ? "Edit Category" : "New Category"}
          </DialogTitle>
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
            <Input {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input {...register("icon")} placeholder="emoji" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                {...register("order", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Parent Category ID</Label>
            <Input {...register("parentId")} placeholder="optional" />
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
