import ProductCard from "@/components/products/product-card";
import type { ProductWithRelations } from "@/components/products/product-card";
import { Reveal } from "@/components/home/reveal";

interface FeaturedProductsProps {
  products: ProductWithRelations[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            Featured Products
          </h2>
          <p className="mb-10 text-muted-foreground">
            Handpicked selections our customers love
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
