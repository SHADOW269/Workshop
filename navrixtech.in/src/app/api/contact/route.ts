import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60,
  uniqueTokenPerInterval: 100,
  maxRequests: 5,
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const allowed = await limiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const data = contactSchema.parse(body);

    await prisma.contactMessage.create({ data });

    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.message },
        { status: 400 }
      );
    }
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
