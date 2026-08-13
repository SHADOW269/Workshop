import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export type OrderSummaryItem = {
  name: string;
  slug?: string;
  image?: string | null;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
};

type OrderSummaryProps = {
  items: OrderSummaryItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
};

export default function OrderSummary({
  items,
  subtotal,
  discount = 0,
  shipping,
  total,
}: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.image ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {item.slug ? (
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-1 text-sm font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
              )}
              {item.variant && (
                <p className="text-xs text-muted-foreground">{item.variant}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Qty {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <Separator className="my-1.5" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span className="gradient-accent-text">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
