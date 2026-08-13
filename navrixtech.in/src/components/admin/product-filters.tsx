"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  categories: { id: string; name: string }[];
}

export function ProductFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
    (formData: FormData) => {
      const sp = new URLSearchParams();
      const search = formData.get("search") as string;
      const category = formData.get("category") as string;
      if (search) sp.set("search", search);
      if (category) sp.set("category", category);
      router.push(`/admin/products?${sp.toString()}`);
    },
    [router]
  );

  return (
    <form action={handleSubmit} className="flex flex-wrap gap-3">
      <Input
        name="search"
        placeholder="Search products..."
        defaultValue={searchParams.get("search") ?? ""}
        className="max-w-sm"
      />
      <select
        name="category"
        defaultValue={searchParams.get("category") ?? ""}
        className="flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
