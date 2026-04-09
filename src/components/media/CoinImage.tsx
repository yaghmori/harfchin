import { COIN_IMAGE_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";

type CoinImageProps = {
  className?: string;
  /** Logical width/height in px. */
  size?: number;
  priority?: boolean;
};

/** Decorative coin asset; pair with visible text (e.g. «۵۰۰ سکه») for accessibility. */
export function CoinImage({
  className,
  size = 28,
  priority = false,
}: CoinImageProps) {
  return (
    <Image
      src={COIN_IMAGE_SRC}
      alt=""
      width={size}
      height={size}
      className={cn(
        "pointer-events-none shrink-0 object-contain select-none",
        className,
      )}
      priority={priority}
    />
  );
}
