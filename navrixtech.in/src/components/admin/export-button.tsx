"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton({ emails }: { emails: string[] }) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(() => {
      const csv = "Email\n" + emails.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      <Download className="h-4 w-4" />
      {isPending ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
