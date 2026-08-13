"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type CartItemInput = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export async function syncCart(userId: string, items: CartItemInput[]) {
  try {
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (items.length > 0) {
      await prisma.cartItem.createMany({
        data: items.map((item) => ({
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Sync cart error:", error);
    throw new Error("Failed to sync cart");
  }
}

export async function getDbCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { position: "asc" } },
              inventory: true,
            },
          },
          variant: true,
        },
      },
    },
  });

  return cart;
}
