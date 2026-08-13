import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold tracking-tighter text-muted-foreground/30">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
