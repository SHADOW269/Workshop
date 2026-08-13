"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { couponSchema } from "@/lib/validators";
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

interface CouponData {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  usageLimit: number | null;
  isActive: boolean;
}

interface Props {
  children: ReactNode;
  coupon?: CouponData;
}

export function CouponForm({ children, coupon }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code ?? "",
      type: (coupon?.type as "PERCENT" | "FIXED") ?? "PERCENT",
      value: coupon?.value ?? 0,
      minOrder: coupon?.minOrder ?? 0,
      maxDiscount: coupon?.maxDiscount ?? undefined,
      validFrom: coupon?.validFrom
        ? new Date(coupon.validFrom).toISOString().split("T")[0]
        : "",
      validUntil: coupon?.validUntil
        ? new Date(coupon.validUntil).toISOString().split("T")[0]
        : "",
      usageLimit: coupon?.usageLimit ?? undefined,
      isActive: coupon?.isActive ?? true,
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const method = coupon ? "PUT" : "POST";
        const url = coupon
          ? `/api/admin/coupons/${coupon.id}`
          : "/api/admin/coupons";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed");
        }
        toast.success(coupon ? "Coupon updated" : "Coupon created");
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
          <DialogTitle>{coupon ? "Edit Coupon" : "New Coupon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input {...register("code")} placeholder="e.g. SAVE10" />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                {...register("type")}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Value *</Label>
              <Input
                type="number"
                {...register("value", { valueAsNumber: true })}
              />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Order (₹)</Label>
              <Input
                type="number"
                {...register("minOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Discount (₹)</Label>
              <Input
                type="number"
                {...register("maxDiscount", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From</Label>
              <Input type="date" {...register("validFrom")} />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" {...register("validUntil")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Usage Limit</Label>
            <Input
              type="number"
              {...register("usageLimit", { valueAsNumber: true })}
              placeholder="Unlimited"
            />
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
