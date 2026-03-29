import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[104px] w-full rounded-lg border border-input bg-[linear-gradient(180deg,#101010_0%,#0c0c0c_100%)] px-3.5 py-2.5 text-sm text-foreground ring-offset-background shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] placeholder:text-muted-foreground/90 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
