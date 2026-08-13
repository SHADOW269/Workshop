import { prisma } from "@/lib/prisma";
import { getPaginationParams } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ExportButton } from "@/components/admin/export-button";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminNewsletterPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);

  const [subscribers, total, allEmails] = await Promise.all([
    prisma.newsletter.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletter.count(),
    prisma.newsletter.findMany({
      where: { subscribed: true },
      select: { email: true },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {allEmails.length} active subscribers
          </span>
          <ExportButton emails={allEmails.map((s) => s.email)} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {subscribers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Mail className="h-12 w-12" />
              <p>No subscribers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Subscribed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">{sub.email}</td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={sub.subscribed ? "default" : "secondary"}
                        >
                          {sub.subscribed ? "Active" : "Unsubscribed"}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("en-IN")}
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
                    <a href={`/admin/newsletter?page=${page - 1}`}>Previous</a>
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
                    <a href={`/admin/newsletter?page=${page + 1}`}>Next</a>
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
