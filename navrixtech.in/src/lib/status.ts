import type { BadgeProps } from "@/components/ui/badge";

export function statusBadgeVariant(status: string): BadgeProps["variant"] {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "gradient";
    case "PENDING":
    case "REFUNDED":
      return "secondary";
    case "CONFIRMED":
    case "PROCESSING":
    case "SHIPPED":
      return "default";
    case "CANCELLED":
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}
