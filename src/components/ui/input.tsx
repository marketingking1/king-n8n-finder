import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-[hsl(216,30%,16%)] px-3 py-2.5 text-sm text-foreground transition-all duration-150",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10",
          "disabled:cursor-not-allowed disabled:bg-[hsl(215,35%,11%)] disabled:text-muted-foreground disabled:opacity-100",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
