import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-[linear-gradient(180deg,#121212_0%,#0f0f0f_100%)] px-6 py-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_20px_36px_-30px_rgba(0,0,0,0.9)] before:pointer-events-none before:absolute before:inset-x-0 before:top-[1px] before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(0,242,254,0.55),transparent)] after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-white/10 md:px-7 md:py-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">{title}</h1>
          {description ? (
            <p className="text-sm font-normal tracking-[0.01em] text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
