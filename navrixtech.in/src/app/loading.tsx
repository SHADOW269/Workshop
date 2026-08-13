export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="hidden items-center gap-8 md:flex">
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="mb-3 aspect-square w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-6 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
