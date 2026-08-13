"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function ClientPagination({
  currentPage,
  totalPages,
}: ClientPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onPageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/products?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
}
