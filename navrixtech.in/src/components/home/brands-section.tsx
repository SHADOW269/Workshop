import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/reveal";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  _count: { products: number };
};

interface BrandsSectionProps {
  brands: Brand[];
}

export default function BrandsSection({ brands }: BrandsSectionProps) {
  if (brands.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            Popular Brands
          </h2>
          <p className="mb-10 text-muted-foreground">
            Trusted names in gaming & tech
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none sm:gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className={cn(
                "flex min-w-[140px] flex-col items-center gap-3 rounded-xl border border-border/50",
                "px-6 py-5 transition-all duration-300",
                "hover:border-primary/30 hover:bg-accent/50 hover:scale-[1.03] sm:min-w-[160px]"
              )}
            >
              {brand.logo ? (
                <div className="relative h-10 w-full">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-xl font-bold gradient-accent-text">
                  {brand.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {brand._count.products} product{brand._count.products !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
