import { prisma } from "@/lib/prisma";
import { getPaginationParams } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { ReviewActions } from "@/components/admin/review-actions";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);
  const status = params.status || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reviews</h1>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ].map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "outline"}
            size="sm"
            asChild
          >
            <a href={`/admin/reviews${opt.value ? `?status=${opt.value}` : ""}`}>
              {opt.label}
            </a>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Star className="h-12 w-12" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Rating
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Review
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b border-border/50">
                      <td className="max-w-[200px] truncate py-3 font-medium">
                        {review.product.name}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {review.user.name || review.user.email}
                      </td>
                      <td className="py-3">
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="max-w-[250px] py-3">
                        {review.title && (
                          <p className="font-medium">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="truncate text-xs text-muted-foreground">
                            {review.body}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            review.status === "APPROVED"
                              ? "default"
                              : review.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {review.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <ReviewActions
                          reviewId={review.id}
                          currentStatus={review.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav aria-label="pagination">
            <ul className="flex items-center gap-1">
              {page > 1 && (
                <li>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/admin/reviews?${new URLSearchParams({
                        ...(status ? { status } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                    >
                      Previous
                    </a>
                  </Button>
                </li>
              )}
              <li>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </li>
              {page < totalPages && (
                <li>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/admin/reviews?${new URLSearchParams({
                        ...(status ? { status } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                    >
                      Next
                    </a>
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
