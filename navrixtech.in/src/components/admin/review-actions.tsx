"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export function ReviewActions({
  reviewId,
  currentStatus,
}: {
  reviewId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Review updated");
        router.refresh();
      } catch {
        toast.error("Failed to update review");
      }
    });
  };

  if (currentStatus !== "PENDING") return null;

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-green-500"
        disabled={isPending}
        onClick={() => updateStatus("APPROVED")}
      >
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        disabled={isPending}
        onClick={() => updateStatus("REJECTED")}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
