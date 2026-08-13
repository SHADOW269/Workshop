"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { formatPrice } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

const POPULAR_CATEGORIES = [
  { label: "Mechanical Keyboards", href: "/products?category=mechanical-keyboards" },
  { label: "Gaming Mice", href: "/products?category=gaming-mice" },
  { label: "Desk Accessories", href: "/products?category=desk-accessories" },
  { label: "Audio", href: "/products?category=audio" },
];

const RECENT_SEARCHES_KEY = "navrix-recent-searches";

export default function SearchOverlay() {
  const { searchOpen, toggleSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    RECENT_SEARCHES_KEY,
    []
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  // Fetch results on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setResults(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const addRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== trimmed);
        return [trimmed, ...filtered].slice(0, 8);
      });
    },
    [setRecentSearches]
  );

  const handleSubmit = (term: string) => {
    if (!term.trim()) return;
    addRecentSearch(term);
    toggleSearch();
    router.push(`/products?q=${encodeURIComponent(term.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit(query);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            onClick={toggleSearch}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-20"
          >
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search keyboards, mice, accessories..."
                className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={toggleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card p-4">
              {/* Loading */}
              {loading && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div className="space-y-1">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Products
                  </p>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => {
                        addRecentSearch(query);
                        toggleSearch();
                      }}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-sm text-primary">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty / no query */}
              {!loading && query && results.length === 0 && debouncedQuery === query && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No products found for &ldquo;{query}&rdquo;
                </p>
              )}

              {/* Recent searches */}
              {!query && recentSearches.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Recent Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          handleSubmit(term);
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        <Clock className="h-3 w-3" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular categories */}
              {!query && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Popular Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={toggleSearch}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
