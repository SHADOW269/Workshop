import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { sendPasswordReset } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent" },
        { status: 200 }
      );
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token,
        expires,
      },
    });

    sendPasswordReset(user.email, token).catch(() => {});

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
