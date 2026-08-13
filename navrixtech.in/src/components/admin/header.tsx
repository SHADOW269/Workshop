"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./sidebar";

interface AdminHeaderProps {
  user: {
    name: string | null;
    email: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center border-b border-border px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:block">
          {user.name || user.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
