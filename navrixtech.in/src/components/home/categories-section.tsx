import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/reveal";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  _count: { products: number };
};

interface CategoriesSectionProps {
  categories: Category[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            Shop by Category
          </h2>
          <p className="mb-10 text-muted-foreground">
            Browse our curated collections
          </p>
        </Reveal>

        <Reveal delay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <>
              <Link
                href={`/products?category=${category.slug}`}
                className={cn(
                  "group relative flex aspect-square overflow-hidden rounded-xl",
                  "border border-border/50 transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30"
                )}
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-blue-accent/20">
                    <span className="text-4xl font-bold text-primary/40">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-5">
                  <h3 className="mb-0.5 text-base font-semibold text-white sm:text-lg">
                    {category.name}
                  </h3>
                  <p className="text-xs text-white/70 sm:text-sm">
                    {category._count.products} product{category._count.products !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
