import {
  Truck,
  Shield,
  Award,
  Headphones,
  BadgeCheck,
  RotateCcw,
} from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: `On orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "100% secure checkout with Razorpay",
  },
  {
    icon: Award,
    title: "1 Year Warranty",
    description: "On all products we sell",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Reach us anytime you need help",
  },
  {
    icon: BadgeCheck,
    title: "Genuine Products",
    description: "100% authentic brands only",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Hassle-free return policy",
  },
];

export default function WhyNavrix() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
          Why Choose Navrix
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          We go the extra mile so you don&apos;t have to
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass flex flex-col items-center rounded-xl p-5 text-center transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 sm:p-6"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
