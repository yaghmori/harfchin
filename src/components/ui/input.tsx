import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-full border bg-secondary px-4 py-3 text-base text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] transition-[box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:ring-2 aria-invalid:ring-destructive/40 aria-invalid:ring-offset-2 aria-invalid:ring-offset-background md:text-sm dark:bg-zinc-800/90 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] dark:focus-visible:ring-primary/45 dark:focus-visible:ring-offset-zinc-950 dark:aria-invalid:ring-offset-zinc-950",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
