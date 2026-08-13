"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { profileSchema, passwordChangeSchema, addressSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(userId: string, data: unknown) {
  try {
    const user = await requireAuth();
    if (user.id !== userId) throw new Error("Forbidden");

    const parsed = profileSchema.parse(data);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.name,
        phone: parsed.phone,
      },
    });

    revalidatePath("/dashboard/profile");
    return { success: true, user: updated };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Update profile error:", error);
    throw new Error("Failed to update profile");
  }
}

export async function changePassword(userId: string, data: unknown) {
  try {
    const user = await requireAuth();
    if (user.id !== userId) throw new Error("Forbidden");

    const parsed = passwordChangeSchema.parse(data);

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser?.password) throw new Error("No password set");

    const isValid = await bcrypt.compare(parsed.currentPassword, dbUser.password);
    if (!isValid) throw new Error("Current password is incorrect");

    const hashed = await bcrypt.hash(parsed.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Change password error:", error);
    throw new Error("Failed to change password");
  }
}

export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(userId: string, data: unknown) {
  try {
    const user = await requireAuth();
    if (user.id !== userId) throw new Error("Forbidden");

    const parsed = addressSchema.parse(data);

    if (parsed.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed, userId },
    });

    revalidatePath("/dashboard/addresses");
    return { success: true, address };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Create address error:", error);
    throw new Error("Failed to create address");
  }
}

export async function updateAddress(id: string, data: unknown) {
  try {
    const user = await requireAuth();
    const parsed = addressSchema.partial().parse(data);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) throw new Error("Forbidden");

    if (parsed.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: parsed,
    });

    revalidatePath("/dashboard/addresses");
    return { success: true, address };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Update address error:", error);
    throw new Error("Failed to update address");
  }
}

export async function deleteAddress(id: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) throw new Error("Forbidden");

    await prisma.address.delete({ where: { id } });

    revalidatePath("/dashboard/addresses");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Delete address error:", error);
    throw new Error("Failed to delete address");
  }
}

export async function setDefaultAddress(userId: string, addressId: string) {
  try {
    const user = await requireAuth();
    if (user.id !== userId) throw new Error("Forbidden");

    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) throw new Error("Forbidden");

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/dashboard/addresses");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") throw error;
    }
    console.error("Set default address error:", error);
    throw new Error("Failed to set default address");
  }
}
