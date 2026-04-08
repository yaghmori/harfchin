import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[var(--game-blue)] to-[var(--game-blue-dark)] text-white shadow-[var(--game-btn-depth)] hover:brightness-105 active:shadow-none [a]:hover:brightness-105",
        outline:
          "border-2 border-[var(--game-blue)]/35 bg-card text-[var(--game-blue-dark)] shadow-sm hover:bg-muted hover:border-[var(--game-blue)]/50 aria-expanded:bg-muted dark:border-[var(--game-blue)]/45 dark:text-[var(--game-blue)]",
        secondary:
          "bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-slate-800 shadow-[0_3px_0_0_rgb(100_116_139/0.35)] hover:brightness-[1.02] active:shadow-none dark:from-[#3d4559] dark:to-[#2f3648] dark:text-slate-100 dark:shadow-[0_3px_0_0_rgb(0_0_0/0.45)]",
        ghost:
          "hover:bg-muted/80 hover:text-foreground aria-expanded:bg-muted/80 dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/12 text-destructive shadow-[0_3px_0_0_rgb(220_38_38/0.25)] hover:bg-destructive/18 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 active:shadow-none dark:bg-destructive/22 dark:hover:bg-destructive/30",
        link: "rounded-md text-[var(--game-blue-dark)] underline-offset-4 shadow-none hover:underline dark:text-[var(--game-blue)]",
        game:
          "min-h-11 rounded-[1.35rem] bg-gradient-to-b from-[var(--game-blue)] to-[var(--game-blue-dark)] px-5 text-base text-white shadow-[var(--game-btn-depth)] hover:brightness-105 active:translate-y-1 active:shadow-none",
        gameMuted:
          "min-h-11 rounded-[1.35rem] bg-gradient-to-b from-[#94a3b8] to-[#64748b] px-5 text-base text-white shadow-[0_4px_0_0_rgb(51_65_85/0.5)] hover:brightness-105 active:translate-y-1 active:shadow-none",
        gameWarm:
          "min-h-12 rounded-[1.5rem] bg-[var(--game-warm-bg)] px-5 text-base font-bold text-[var(--game-warm-text)] shadow-[0_5px_0_0_rgb(194_65_12/0.22)] hover:brightness-[1.03] active:translate-y-1 active:shadow-none",
        gameMint:
          "min-h-12 rounded-[1.5rem] bg-[var(--game-mint-bg)] px-5 text-base font-bold text-[var(--game-mint-text)] shadow-[0_5px_0_0_rgb(22_101_52/0.2)] hover:brightness-[1.03] active:translate-y-1 active:shadow-none",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        xs: "h-6 gap-1 rounded-xl px-2 text-xs in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-xl px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 rounded-[1.25rem] px-5 text-base has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
        icon: "size-9 rounded-xl",
        "icon-xs":
          "size-7 rounded-lg in-data-[slot=button-group]:rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg in-data-[slot=button-group]:rounded-xl",
        "icon-lg": "size-11 rounded-2xl",
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
