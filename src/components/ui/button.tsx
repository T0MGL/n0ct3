import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-primary-foreground shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-lg hover:from-[#DC2626] hover:to-[#B91C1C] active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:bg-destructive/90 hover:shadow-lg",
        outline: "border border-gold/30 bg-transparent hover:bg-gold/10 hover:border-gold/50 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:bg-secondary/80 hover:shadow-lg",
        ghost: "hover:bg-muted/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        hero: "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_16px_rgba(239,68,68,0.3)] hover:from-[#DC2626] hover:to-[#B91C1C] active:scale-[0.98] font-semibold",
        premium: "bg-secondary/50 text-card-foreground border border-gold/30 shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:border-gold/50 hover:bg-secondary/70 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
