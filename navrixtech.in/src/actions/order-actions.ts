"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendShippingUpdate } from "@/lib/email";
import type { OrderStatus } from "@prisma/client";

type GetOrdersOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
};

export async function getOrders(opts: GetOrdersOptions = {}) {
  const { page = 1, pageSize = 12, status, userId } = opts;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrder(id: string) {
  const user = await requireAuth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      address: true,
    },
  });

  if (!order) throw new Error("Order not found");

  if (
    (user as { role?: string }).role !== "ADMIN" &&
    order.userId !== user.id
  ) {
    throw new Error("Forbidden");
  }

  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    await requireAdmin();

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { user: { select: { email: true } } },
    });

    if (["SHIPPED", "DELIVERED"].includes(status)) {
      const trackingUrl = order.trackingUrl ?? undefined;

      if (order.user.email) {
        sendShippingUpdate(
          order.user.email,
          order.orderNumber,
          status,
          trackingUrl
        ).catch(() => {});
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/orders/${order.id}`);

    return { success: true, order };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        throw error;
      }
    }
    console.error("Update order status error:", error);
    throw new Error("Failed to update order status");
  }
}

export async function cancelOrder(id: string) {
  try {
    const user = await requireAuth();

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) throw new Error("Order not found");

    if ((user as { role?: string }).role !== "ADMIN" && order.userId !== user.id) {
      throw new Error("Forbidden");
    }

    if (order.status !== "PENDING") {
      throw new Error("Only pending orders can be cancelled");
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/dashboard/orders");

    return { success: true, order: updated };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        throw error;
      }
    }
    console.error("Cancel order error:", error);
    throw new Error("Failed to cancel order");
  }
}
