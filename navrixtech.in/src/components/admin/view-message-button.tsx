"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MailOpen } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export function ViewMessageButton({ message }: { message: ContactMessage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !message.isRead) {
      startTransition(async () => {
        try {
          await fetch(`/api/admin/contact/${message.id}`, { method: "PATCH" });
          router.refresh();
        } catch {
          toast.error("Failed to mark as read");
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MailOpen className="h-4 w-4" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{message.subject || "No Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{message.name}</span>
            <span className="text-muted-foreground">&lt;{message.email}&gt;</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(message.createdAt).toLocaleString("en-IN")}
          </p>
          <div className="rounded-md border border-border p-4 text-sm">
            {message.message}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
