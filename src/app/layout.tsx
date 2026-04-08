import { AppProviders } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حرفچین — اسم و فامیل آنلاین",
  description: "بازی چندنفره اسم و فامیل با حروف فارسی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("h-full", vazirmatn.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
