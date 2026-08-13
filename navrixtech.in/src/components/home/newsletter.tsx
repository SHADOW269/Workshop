"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Subscribed! Check your inbox for a welcome email.");
      setEmail("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 sm:p-12"
        >
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-2 text-3xl font-bold tracking-tight">
              Stay in the Loop
            </h2>
            <p className="mb-8 text-muted-foreground">
              Get notified about new drops, exclusive deals, and gaming news.
              No spam, ever.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                variant="gradient"
                disabled={loading}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
