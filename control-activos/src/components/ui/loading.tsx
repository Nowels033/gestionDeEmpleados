"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = "Cargando..." }: LoadingProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mb-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
        <div
          className="absolute inset-0 motion-safe:animate-spin rounded-full border-2 border-transparent border-t-primary"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("motion-safe:animate-pulse space-y-4", className)} aria-hidden="true">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/70 soft-grid" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted/70 soft-grid" />
        <div className="h-64 rounded-xl bg-muted/70 soft-grid" />
      </div>
    </div>
  );
}
