"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          boxShadow:
            "0 1px 0 rgb(255 255 255 / 0.03) inset, 0 24px 40px -28px rgb(0 0 0 / 0.9)",
        },
        success: {
          iconTheme: {
            primary: "#00F2FE",
            secondary: "#0A0A0A",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
