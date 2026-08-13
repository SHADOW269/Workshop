import ProductCard from "@/components/products/product-card";
import type { ProductWithRelations } from "@/components/products/product-card";
import { Reveal } from "@/components/home/reveal";

interface NewArrivalsProps {
  products: ProductWithRelations[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            New Arrivals
          </h2>
          <p className="mb-10 text-muted-foreground">
            Fresh drops just landed in the store
          </p>
        </Reveal>

        <Reveal delay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
