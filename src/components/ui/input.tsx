import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border-0 bg-[var(--game-input)] px-3.5 py-2 text-base text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] transition-[box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-[var(--game-blue)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-bg)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:ring-2 aria-invalid:ring-destructive/35 aria-invalid:ring-offset-2 aria-invalid:ring-offset-[var(--game-bg)] md:text-sm dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] dark:focus-visible:ring-offset-[var(--game-bg)] dark:aria-invalid:ring-offset-[var(--game-bg)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
