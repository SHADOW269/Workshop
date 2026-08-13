import { prisma } from "@/lib/prisma";
import { getPaginationParams, truncate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ViewMessageButton } from "@/components/admin/view-message-button";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminContactPage({ searchParams }: Props) {
  const params = await searchParams;
  const { page, pageSize, skip } = getPaginationParams(params);

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contact Messages</h1>

      <Card>
        <CardContent className="pt-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12" />
              <p>No messages yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Subject
                    </th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">
                      Preview
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
                  {messages.map((msg) => (
                    <tr
                      key={msg.id}
                      className={`border-b border-border/50 ${
                        !msg.isRead ? "bg-muted/30" : ""
                      }`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <span className={msg.isRead ? "" : "font-medium"}>
                            {msg.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {msg.email}
                      </td>
                      <td className="py-3">{msg.subject || "-"}</td>
                      <td className="max-w-[200px] truncate py-3 text-muted-foreground">
                        {truncate(msg.message, 50)}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <ViewMessageButton message={msg} />
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
                    <a href={`/admin/contact?page=${page - 1}`}>Previous</a>
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
                    <a href={`/admin/contact?page=${page + 1}`}>Next</a>
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
