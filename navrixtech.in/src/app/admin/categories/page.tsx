import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { products: true } },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <CategoryForm>
          <Button>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </CategoryForm>
      </div>

      <Card>
        <CardContent className="pt-6">
          {categories.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No categories yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-md border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cat.icon && <span className="text-lg">{cat.icon}</span>}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.name}</span>
                          <Badge variant="secondary">
                            {cat._count.products} products
                          </Badge>
                          {!cat.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        {cat.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <CategoryForm category={cat}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </CategoryForm>
                    </div>
                  </div>

                  {cat.children.length > 0 && (
                    <div className="ml-6 mt-3 space-y-2 border-l border-border pl-4">
                      {cat.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{child.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {child._count.products}
                            </Badge>
                          </div>
                          <CategoryForm category={child}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </CategoryForm>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
