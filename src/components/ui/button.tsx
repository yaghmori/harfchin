import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex cursor-pointer shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 outline-none select-none focus-visible:border-primary/30 focus-visible:ring-3 focus-visible:ring-primary/35 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:focus-visible:ring-primary/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white  hover:brightness-[1.06] active:scale-[0.99]  [a]:hover:brightness-[1.06]",
        outline:
          "border bg-background text-foreground shadow-none hover:bg-muted aria-expanded:bg-muted dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:aria-expanded:bg-zinc-600",
        secondary:
          "border-0 bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] hover:bg-secondary/85 active:shadow-none dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:shadow-none",
        ghost:
          "hover:bg-muted/80 hover:text-foreground aria-expanded:bg-muted/80 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 dark:aria-expanded:bg-zinc-800/80",
        destructive:
          "bg-destructive/12 text-destructive hover:bg-destructive/20 hover:shadow-sm active:bg-destructive/25 active:scale-[0.99] dark:hover:bg-destructive/18",
        link: "h-auto rounded-none px-0 py-0 text-primary underline-offset-4 shadow-none hover:underline dark:text-violet-400",
      },
      size: {
        default:
          "h-14 gap-2 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        xs: "h-8 gap-1 rounded-full px-2 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1.5 rounded-full px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-18 gap-2 rounded-full px-6 text-base font-bold has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5",
        icon: "size-9 rounded-full",
        "icon-xs":
          "size-7 rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
