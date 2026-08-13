import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/reveal";

const reviews = [
  {
    id: "1",
    name: "Arjun M.",
    rating: 5,
    text: "Best mechanical keyboard I've ever owned. The build quality is insane for the price. Navrix is my go-to for peripherals now.",
    date: "2 weeks ago",
  },
  {
    id: "2",
    name: "Priya K.",
    rating: 5,
    text: "Ordered a gaming mouse and a desk mat. Both arrived quickly and were packed really well. Products look even better in person.",
    date: "1 month ago",
  },
  {
    id: "3",
    name: "Rohan S.",
    rating: 4,
    text: "Great selection of brands and products. The pricing is very competitive compared to other Indian stores. Will order again.",
    date: "3 weeks ago",
  },
  {
    id: "4",
    name: "Ananya D.",
    rating: 5,
    text: "The customer support team was super helpful when I had a question about my order. Fast delivery to Bangalore too!",
    date: "1 week ago",
  },
  {
    id: "5",
    name: "Vikram R.",
    rating: 5,
    text: "Finally an Indian store that takes gaming gear seriously. The Navrix desk accessories are top notch. Love the quality.",
    date: "2 months ago",
  },
  {
    id: "6",
    name: "Sneha P.",
    rating: 4,
    text: "Got a keyboard for my husband's birthday. He absolutely loved it! Packaging was premium and delivery was on time.",
    date: "10 days ago",
  },
];

export default function ReviewsSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            What Our Customers Say
          </h2>
          <p className="mb-10 text-muted-foreground">
            Real reviews from real gamers
          </p>
        </Reveal>

        <Reveal delay={0.1} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass rounded-xl p-6 transition-all duration-300 hover:border-primary/20"
            >
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-transparent text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{review.name}</span>
                <span className="text-xs text-muted-foreground">
                  {review.date}
                </span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
