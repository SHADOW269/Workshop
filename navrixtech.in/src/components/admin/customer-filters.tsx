"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
    (formData: FormData) => {
      const sp = new URLSearchParams();
      const search = formData.get("search") as string;
      if (search) sp.set("search", search);
      router.push(`/admin/customers?${sp.toString()}`);
    },
    [router]
  );

  return (
    <form action={handleSubmit} className="flex flex-wrap gap-3">
      <Input
        name="search"
        placeholder="Search by name or email..."
        defaultValue={searchParams.get("search") ?? ""}
        className="max-w-sm"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
