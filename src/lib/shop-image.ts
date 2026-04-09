/**
 * Normalize image URLs stored in the DB for the coin shop.
 * - `http://` / `https://` (and protocol-relative `//`) → used as remote src (Next/Image with `unoptimized`).
 * - Anything else → site-relative path under `/public` (leading `/` added if missing).
 */
export function resolveShopImageUrl(raw: string | null | undefined): {
  src: string;
  isRemote: boolean;
} {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { src: "/splash-screen.png", isRemote: false };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { src: trimmed, isRemote: true };
  }
  if (trimmed.startsWith("//")) {
    return { src: `https:${trimmed}`, isRemote: true };
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return { src: path, isRemote: false };
}
