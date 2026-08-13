"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
  disabled?: boolean
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  (
    {
      rating,
      maxStars = 5,
      size = "md",
      interactive = false,
      onRatingChange,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [hoverRating, setHoverRating] = React.useState(0)

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-0.5", className)}
        onMouseLeave={() => interactive && setHoverRating(0)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starIndex = i + 1
          const filled =
            hoverRating > 0
              ? starIndex <= hoverRating
              : starIndex <= Math.floor(rating)
          const halfFilled =
            hoverRating === 0 &&
            !filled &&
            starIndex === Math.ceil(rating) &&
            rating % 1 >= 0.25

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive || disabled}
              className={cn(
                "relative focus:outline-none",
                interactive && !disabled && "cursor-pointer hover:scale-110 transition-transform",
                !interactive && "cursor-default"
              )}
              onClick={() => interactive && onRatingChange?.(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              aria-label={`${starIndex} star${starIndex !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  "transition-colors",
                  filled
                    ? "fill-primary text-primary"
                    : halfFilled
                      ? "fill-primary/50 text-primary"
                      : "fill-transparent text-muted-foreground/40"
                )}
              />
            </button>
          )
        })}
        {rating > 0 && (
          <span className="ml-1 text-sm text-muted-foreground tabular-nums">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    )
  }
)
StarRating.displayName = "StarRating"

export { StarRating, type StarRatingProps }
