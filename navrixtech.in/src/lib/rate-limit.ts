type RateLimitEntry = {
  count: number;
  resetTime: number;
};

type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
  maxRequests: number;
};

type CheckFn = (key: string) => Promise<boolean>;

export function rateLimit(opts: RateLimitOptions): { check: CheckFn } {
  const tokens = new Map<string, RateLimitEntry>();

  const intervalMs = opts.interval * 1000;

  const cleanup = () => {
    const now = Date.now();
    const entries = Array.from(tokens.entries());

    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        tokens.delete(key);
      }
    }

    if (tokens.size > opts.uniqueTokenPerInterval) {
      const keysToDelete = entries
        .sort((a, b) => a[1].resetTime - b[1].resetTime)
        .slice(0, tokens.size - opts.uniqueTokenPerInterval)
        .map(([key]) => key);

      for (const key of keysToDelete) {
        tokens.delete(key);
      }
    }
  };

  return {
    async check(key: string): Promise<boolean> {
      cleanup();

      const now = Date.now();
      const entry = tokens.get(key);

      if (!entry || now > entry.resetTime) {
        tokens.set(key, {
          count: 1,
          resetTime: now + intervalMs,
        });
        return true;
      }

      if (entry.count >= opts.maxRequests) {
        return false;
      }

      entry.count++;
      return true;
    },
  };
}
