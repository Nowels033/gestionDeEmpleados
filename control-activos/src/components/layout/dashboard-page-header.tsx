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
        "rounded-xl border border-border bg-card px-6 py-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] md:px-7 md:py-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">{title}</h1>
          {description ? (
            <p className="text-sm font-normal tracking-[0.01em] text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}
