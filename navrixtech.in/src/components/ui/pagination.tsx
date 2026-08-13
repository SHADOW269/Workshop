import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      if (currentPage > 3) items.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) items.push(i)
      if (currentPage < totalPages - 2) items.push("...")
      items.push(totalPages)
    }
    return items
  }, [currentPage, totalPages])

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>
        {pages.map((page, i) =>
          page === "..." ? (
            <li key={`ellipsis-${i}`}>
              <span className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </span>
            </li>
          ) : (
            <li key={page}>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            </li>
          )
        )}
        <li>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  )
}

function PaginationPrevious({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  )
}

function PaginationNext({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
    >
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  )
}

export {
  Pagination,
  PaginationPrevious,
  PaginationNext,
}
