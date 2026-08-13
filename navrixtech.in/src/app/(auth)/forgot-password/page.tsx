"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/auth-shell";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const result = await res.json().catch(() => null);
        toast.error(result?.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a link to reset it"
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Check your inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If an account exists for that email, we&apos;ve sent a password reset
              link. It expires in 1 hour.
            </p>
          </div>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
