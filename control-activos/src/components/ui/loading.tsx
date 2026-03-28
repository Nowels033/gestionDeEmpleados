"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
}

function PulseBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/70", className)} />;
}

export function Loading({ className, text = "Cargando datos" }: LoadingProps) {
  return (
    <div
      className={cn("space-y-5", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{text}</span>

      <div className="rounded-xl border border-border bg-card p-5">
        <PulseBlock className="h-3 w-32" />
        <PulseBlock className="mt-4 h-8 w-52" />
        <PulseBlock className="mt-3 h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-5">
            <PulseBlock className="h-3 w-20" />
            <PulseBlock className="mt-3 h-7 w-24" />
            <PulseBlock className="mt-4 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-[1.2fr_2fr_1.4fr_1.2fr_1.4fr] gap-3 border-b border-border pb-3">
          {[1, 2, 3, 4, 5].map((index) => (
            <PulseBlock key={index} className="h-3 w-full" />
          ))}
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="grid grid-cols-[1.2fr_2fr_1.4fr_1.2fr_1.4fr] gap-3">
              <PulseBlock className="h-4 w-20" />
              <PulseBlock className="h-4 w-40" />
              <PulseBlock className="h-4 w-24" />
              <PulseBlock className="h-4 w-24" />
              <PulseBlock className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <Loading className={className} text="Cargando panel" />;
}
