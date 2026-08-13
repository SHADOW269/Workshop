"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  user: { name: string | null };
};

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function ReviewSection({
  productId,
  reviews,
  averageRating,
  totalReviews,
}: ReviewSectionProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const userHasReviewed = session
    ? reviews.some((r) => r.user.name === session.user?.name)
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title || undefined, body: body || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted! It will appear after moderation.");
      setSubmitted(true);
      setRating(0);
      setTitle("");
      setBody("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="text-center">
          <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="mt-1 flex items-center justify-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.round(averageRating)
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-2">
              <span className="w-8 text-right text-xs text-muted-foreground">
                {d.stars}★
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: totalReviews > 0 ? `${(d.count / totalReviews) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="w-8 text-xs text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Write review form */}
      {session && !userHasReviewed && !submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 p-5"
        >
          <h4 className="mb-4 font-semibold">Write a Review</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Your Rating</label>
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
            </div>
            <Input
              placeholder="Review title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Tell others what you think about this product..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </motion.div>
      )}

      {session && !session.user && (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </p>
        )}
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-border/50 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-transparent text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {review.user.name ?? "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {review.title && (
              <h5 className="mb-1 text-sm font-semibold">{review.title}</h5>
            )}
            {review.body && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.body}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
