"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.15 0.005 260 / 0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid oklch(0.2 0.005 260 / 0.6)",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
