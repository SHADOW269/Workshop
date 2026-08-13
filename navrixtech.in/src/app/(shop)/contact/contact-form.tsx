"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validators";
import type { z } from "zod";

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to send");

      setStatus("success");
      reset();
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Name
        </label>
        <input
          {...register("name")}
          id="name"
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
          Subject
        </label>
        <input
          {...register("subject")}
          id="subject"
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="How can we help?"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          {...register("message")}
          id="message"
          rows={5}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tell us more..."
        />
        {errors.message && (
          <p className="mt-1 text-xs text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>

      {status === "success" && (
        <p className="text-center text-sm text-green-600">
          Message sent! We&apos;ll get back to you soon.
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-sm text-destructive">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
