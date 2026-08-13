import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { position: "asc" } } },
            },
            variant: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId, variantId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { position: "asc" } } },
            },
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { itemId, quantity } = await req.json();

    if (!itemId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
