"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Image = {
  id?: string;
  url: string;
  alt: string | null;
};

interface ProductGalleryProps {
  images: Image[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentImage = images[selectedIndex];

  const goToPrev = useCallback(() => {
    setSelectedIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted/50">
        <span className="text-sm text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-3">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.url}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20",
                  index === selectedIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Image
                src={currentImage.url}
                alt={currentImage.alt ?? ""}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom button */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Open lightbox"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-10 text-white hover:text-white/80"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative aspect-square w-full max-w-2xl">
              <Image
                src={currentImage.url}
                alt={currentImage.alt ?? ""}
                fill
                className="object-contain"
                sizes="80vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
