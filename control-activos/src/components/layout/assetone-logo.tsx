import * as React from "react";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface AssetOneLogoProps {
  className?: string;
  markClassName?: string;
  withText?: boolean;
  subtitle?: string;
}

export function AssetOneLogo({
  className,
  markClassName,
  withText = true,
  subtitle,
}: AssetOneLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("assetone-mark shrink-0", markClassName)} aria-hidden="true">
        <span className="assetone-mark-left" />
        <span className="assetone-mark-right" />
        <span className="assetone-mark-bar" />
      </span>
      {withText ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-[0.2em] text-foreground">
            {BRAND_NAME}
          </span>
          {subtitle ? (
            <span className="block truncate text-[10px] font-normal tracking-[0.14em] text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
