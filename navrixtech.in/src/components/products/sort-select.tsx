"use client";

import { PRODUCT_SORT_OPTIONS } from "@/lib/constants";

export default function SortSelect({ currentSort }: { currentSort: string }) {
  return (
    <select
      defaultValue={currentSort}
      className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      onChange={(e) => {
        const params = new URLSearchParams(window.location.search);
        params.set("sort", e.target.value);
        params.delete("page");
        window.location.search = params.toString();
      }}
    >
      {PRODUCT_SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
