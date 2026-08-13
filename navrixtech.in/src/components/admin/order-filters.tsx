"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
    (formData: FormData) => {
      const sp = new URLSearchParams();
      const search = formData.get("search") as string;
      const status = formData.get("status") as string;
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      router.push(`/admin/orders?${sp.toString()}`);
    },
    [router]
  );

  return (
    <form action={handleSubmit} className="flex flex-wrap gap-3">
      <Input
        name="search"
        placeholder="Search order number..."
        defaultValue={searchParams.get("search") ?? ""}
        className="max-w-sm"
      />
      <select
        name="status"
        defaultValue={searchParams.get("status") ?? ""}
        className="flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
