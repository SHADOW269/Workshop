import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = newsletterSchema.parse(body);

    await prisma.newsletter.upsert({
      where: { email },
      update: { subscribed: true },
      create: { email },
    });

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
