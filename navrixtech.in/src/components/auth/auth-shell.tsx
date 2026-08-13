import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="gradient-accent flex h-9 w-9 items-center justify-center rounded-lg text-lg font-black text-white">
          N
        </span>
        <span className="gradient-accent-text text-2xl font-bold tracking-tight">
          {SITE_NAME}
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="glass rounded-xl p-6 sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
        {footer && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
