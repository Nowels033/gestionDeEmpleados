"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = "Cargando..." }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
