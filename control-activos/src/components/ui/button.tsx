import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent text-sm font-medium tracking-[0.01em] transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[linear-gradient(135deg,#00f2fe_0%,#09d6eb_44%,#07b9dd_100%)] text-[#04161a] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_14px_26px_-16px_rgba(0,242,254,0.95)] hover:-translate-y-[1px] hover:shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_18px_30px_-14px_rgba(0,242,254,0.98)] active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_24px_-18px_rgba(239,68,68,0.95)] hover:bg-destructive/90",
        outline:
          "border-border bg-[linear-gradient(180deg,#121212_0%,#0d0d0d_100%)] text-foreground hover:border-primary/35 hover:bg-[linear-gradient(180deg,#151515_0%,#101010_100%)] hover:text-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-primary/30 hover:bg-secondary/80 hover:text-foreground",
        ghost: "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
