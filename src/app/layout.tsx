import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
      className={cn("h-full", vazirmatn.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full bg-background font-[family-name:var(--font-vazirmatn),sans-serif] text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
