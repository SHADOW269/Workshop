import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import Image from "next/image";
import { BannerForm } from "@/components/admin/banner-form";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Banners</h1>
        <BannerForm>
          <Button>
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        </BannerForm>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No banners yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="relative h-20 w-40 shrink-0 overflow-hidden rounded bg-muted">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{banner.title}</span>
                    <Badge variant="outline">#{banner.order}</Badge>
                    <Badge
                      variant={banner.isActive ? "default" : "secondary"}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {banner.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {banner.subtitle}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Position: {banner.position}
                    {banner.ctaLabel && ` • CTA: ${banner.ctaLabel}`}
                  </p>
                </div>
                <BannerForm banner={banner}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </BannerForm>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
