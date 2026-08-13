"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface Props {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (status: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update");
        }
        toast.success("Order status updated");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update status");
      }
    });
  };

  return (
    <Select defaultValue={currentStatus} onValueChange={handleUpdate}>
      <SelectTrigger disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
