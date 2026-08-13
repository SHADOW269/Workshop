"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/auth-shell";

type ResetInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetInput) => {
    if (!token) {
      setTokenError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...data }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(
          result?.error === "Invalid or expired token"
            ? "This reset link is invalid or has expired"
            : result?.error ?? "Failed to reset password"
        );
        return;
      }

      setDone(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <AuthShell title="Invalid reset link">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            This password reset link is missing. Request a new one to continue.
          </p>
          <Button variant="gradient" className="w-full" asChild>
            <Link href="/forgot-password">Request New Link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Your password has been reset successfully. You can now sign in
            with your new password.
          </p>
          <Button variant="gradient" className="w-full" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
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
            "Reset Password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
