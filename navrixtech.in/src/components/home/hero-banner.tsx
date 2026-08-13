"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
};

interface HeroBannerProps {
  banners: Banner[];
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;
    const timer = setInterval(scrollNext, 5000);
    return () => clearInterval(timer);
  }, [emblaApi, scrollNext, banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-20 sm:min-h-[70vh] sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
              <span className="gradient-accent-text">{SITE_NAME}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Premium gaming peripherals & consumer electronics designed for
              those who demand more.
            </p>
            <Button variant="gradient" size="lg" asChild>
              <Link href="/products">Shop Now</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="relative min-w-full"
            >
              <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <h2 className="mb-3 text-3xl font-bold text-white sm:text-5xl">
                {banners[selectedIndex].title}
              </h2>
              {banners[selectedIndex].subtitle && (
                <p className="mb-6 text-base text-white/80 sm:text-lg">
                  {banners[selectedIndex].subtitle}
                </p>
              )}
              {banners[selectedIndex].ctaLabel &&
                banners[selectedIndex].ctaLink && (
                  <Button variant="gradient" size="lg" asChild>
                    <Link href={banners[selectedIndex].ctaLink!}>
                      {banners[selectedIndex].ctaLabel}
                    </Link>
                  </Button>
                )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "w-8 gradient-accent"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
