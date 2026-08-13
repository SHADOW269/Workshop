import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardSidebar from "@/components/account/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div>
          <DashboardSidebar />
        </div>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
