import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        create: { key, value: value as object },
        update: { value: value as object },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
