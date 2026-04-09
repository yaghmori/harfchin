import { CoinShopFreeCoins } from "@/components/shop/CoinShopFreeCoins";
import { CoinShopPackageList } from "@/components/shop/CoinShopPackageList";
import type { ShopPackageRow } from "@/server/services/coin-shop.service";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";

function formatFaCoins(n: number) {
  return n.toLocaleString("fa-IR");
}

type CoinShopViewProps = {
  balance: number;
  packages: ShopPackageRow[];
};

export function CoinShopView({ balance, packages }: CoinShopViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-8 pb-8">
      <section className="rounded-[1.35rem] border border-border/70 bg-card p-7 text-center shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
        <div className="mx-auto mb-5 grid size-[4.5rem] place-items-center rounded-full bg-linear-to-b from-amber-300 to-amber-500 text-3xl font-black text-amber-950 shadow-inner ring-[5px] ring-amber-200/55 dark:from-amber-400 dark:to-amber-600 dark:ring-amber-800/45">
          $
        </div>
        <p className="text-sm font-semibold text-muted-foreground">موجودی فعلی شما</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-[2rem]">
          {formatFaCoins(balance)} سکه
        </p>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-start text-lg font-black text-foreground">سکه رایگان</h2>
        <CoinShopFreeCoins />
      </section>

      <section className="space-y-3.5">
        <div className="text-start">
          <h2 className="text-lg font-black text-foreground">خرید بسته سکه</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            تراکنش‌های امن و سریع
          </p>
        </div>
        <CoinShopPackageList packages={packages} />
      </section>

      <footer className="mt-1 space-y-6 rounded-[1.25rem] border border-border/50 bg-muted/50 px-5 py-9 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-center gap-10 text-muted-foreground">
          <Lock className="size-7 shrink-0 opacity-75" strokeWidth={1.65} aria-hidden />
          <CreditCard className="size-7 shrink-0 opacity-75" strokeWidth={1.65} aria-hidden />
          <ShieldCheck className="size-7 shrink-0 opacity-75" strokeWidth={1.65} aria-hidden />
        </div>
        <p className="mx-auto max-w-[19rem] text-[0.8rem] font-medium leading-[1.85] text-muted-foreground">
          پرداخت‌ها تحت پروتکل‌های امن بانکی انجام می‌شود و سکه‌ها بلافاصله پس از تأیید خرید به
          حساب شما اضافه می‌گردد.
        </p>
        <p className="text-[0.7rem] font-medium text-muted-foreground/85">
          © ۲۰۲۳ فروشگاه سکه - تمامی حقوق محفوظ است
        </p>
      </footer>
    </div>
  );
}
