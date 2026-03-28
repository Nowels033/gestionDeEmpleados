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
        "rounded-2xl border border-border/70 bg-gradient-to-r from-background/95 via-background/90 to-primary/10 p-4 shadow-sm md:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
