"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { addressSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type AddressInput = z.infer<typeof addressSchema>;

type AddressFormProps = {
  onSubmit: (data: AddressInput) => void;
  initialData?: Partial<AddressInput>;
  loading?: boolean;
  submitLabel?: string;
};

export default function AddressForm({
  onSubmit,
  initialData,
  loading,
  submitLabel = "Save Address",
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India", isDefault: false, ...initialData },
  });

  const isDefault = watch("isDefault");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          autoComplete="name"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="10-digit mobile number"
          autoComplete="tel"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="line1">Address Line 1</Label>
        <Input
          id="line1"
          placeholder="House number, street"
          autoComplete="address-line1"
          {...register("line1")}
        />
        {errors.line1 && (
          <p className="text-xs text-destructive">{errors.line1.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="line2">Address Line 2 (optional)</Label>
        <Input
          id="line2"
          placeholder="Apartment, block, landmark"
          autoComplete="address-line2"
          {...register("line2")}
        />
        {errors.line2 && (
          <p className="text-xs text-destructive">{errors.line2.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="Mumbai"
          autoComplete="address-level2"
          {...register("city")}
        />
        {errors.city && (
          <p className="text-xs text-destructive">{errors.city.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="state">State</Label>
        <Input
          id="state"
          placeholder="Maharashtra"
          autoComplete="address-level1"
          {...register("state")}
        />
        {errors.state && (
          <p className="text-xs text-destructive">{errors.state.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pincode">PIN Code</Label>
        <Input
          id="pincode"
          inputMode="numeric"
          placeholder="400001"
          autoComplete="postal-code"
          {...register("pincode")}
        />
        {errors.pincode && (
          <p className="text-xs text-destructive">{errors.pincode.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="country">Country</Label>
        <Input id="country" {...register("country")} />
        {errors.country && (
          <p className="text-xs text-destructive">{errors.country.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox
          id="isDefault"
          checked={isDefault}
          onCheckedChange={(v) => setValue("isDefault", Boolean(v))}
        />
        <Label htmlFor="isDefault" className="font-normal">
          Set as default address
        </Label>
      </div>

      <div className="sm:col-span-2">
        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
