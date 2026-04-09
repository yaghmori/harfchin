"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
} from "@/hooks/api-mutations";
import { useSyncErrorToToast } from "@/hooks/use-sync-error-toast";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/constants";
import { Loader2, Lock, Mail, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ProfileEditClientProps = {
  initialName: string;
  accountIdentifier: string;
};

export function ProfileEditClient({
  initialName,
  accountIdentifier,
}: ProfileEditClientProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName.trim());
  const [bio, setBio] = useState(
    "عاشق بازی اسم و فامیل! بیاید با هم بازی کنیم.",
  );
  const [publicProfile, setPublicProfile] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const loading = updateProfileMutation.isPending;

  useSyncErrorToToast(error);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmed = name.trim();
      if (!trimmed) {
        setError("نام نمایشی را وارد کنید.");
        return;
      }
      try {
        await updateProfileMutation.mutateAsync({ name: trimmed });
        toast.success("پروفایل ذخیره شد.");
        router.push("/profile");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا");
      } finally {
        updateProfileMutation.reset();
      }
    },
    [name, router, updateProfileMutation],
  );

  const handlePasswordDialogOpenChange = useCallback(
    (open: boolean) => {
      setPasswordDialogOpen(open);
      if (!open) {
        setNewPassword("");
        setConfirmNewPassword("");
        changePasswordMutation.reset();
      }
    },
    [changePasswordMutation],
  );

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      setDeleteDialogOpen(open);
      if (!open) {
        deleteAccountMutation.reset();
      }
    },
    [deleteAccountMutation],
  );

  const submitChangePassword = useCallback(async () => {
    const payload = { newPassword, confirmNewPassword };
    try {
      await changePasswordMutation.mutateAsync(payload);
      toast.success("رمز عبور با موفقیت تغییر کرد.");
      handlePasswordDialogOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر رمز عبور");
    } finally {
      changePasswordMutation.reset();
    }
  }, [
    changePasswordMutation,
    confirmNewPassword,
    handlePasswordDialogOpenChange,
    newPassword,
  ]);

  const onDeleteAccount = useCallback(async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      toast.success("حساب کاربری حذف شد.");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف حساب انجام نشد.");
    } finally {
      deleteAccountMutation.reset();
    }
  }, [deleteAccountMutation, router]);

  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-8" dir="rtl">
      <h1 className="sr-only">ویرایش پروفایل</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="profile-name"
            className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300"
          >
            نام نمایشی
          </Label>
          <div className="relative">
            <Input
              id="profile-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoComplete="nickname"
              placeholder="مثلاً آرش راد"
              className="h-14 rounded-3xl border-zinc-200/80 bg-zinc-100 ps-12 text-right text-lg font-extrabold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <UserRound
              className="pointer-events-none absolute inset-y-0 left-4 my-auto size-5 text-[#6D28D9]"
              aria-hidden
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="profile-account-id"
            className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300"
          >
            ایمیل
          </Label>
          <div className="relative">
            <Input
              id="profile-account-id"
              type="text"
              value={accountIdentifier}
              readOnly
              dir="ltr"
              className="h-14 rounded-3xl border-zinc-200/80 bg-zinc-100 ps-12 text-left text-lg font-extrabold text-zinc-700 opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <Mail
              className="pointer-events-none absolute inset-y-0 left-4 my-auto size-5 text-[#6D28D9]"
              aria-hidden
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="profile-bio"
            className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300"
          >
            بیوگرافی
          </Label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-3xl border border-zinc-200/80 bg-zinc-100 px-4 py-3 text-right text-lg font-semibold text-zinc-700 outline-none ring-0 placeholder:text-zinc-400 focus:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            placeholder="عاشق بازی اسم و فامیل! بیاید با هم بازی کنیم."
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full text-base font-bold shadow-[0_8px_24px_rgba(126,58,242,0.35)]"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              در حال ذخیره…
            </>
          ) : (
            "ذخیره تغییرات"
          )}
        </Button>

        <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => setPublicProfile((v) => !v)}
              aria-pressed={publicProfile}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                publicProfile ? "bg-[#6D28D9]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all ${
                  publicProfile ? "right-1" : "right-7"
                }`}
              />
            </button>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                پروفایل عمومی
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                دیگران می‌توانند شما را جستجو کنند
              </p>
            </div>
          </div>

          <div className="mx-4 border-t border-zinc-200 dark:border-zinc-800" />

          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 text-right"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <Lock className="size-5 text-[#6D28D9]" aria-hidden />
            <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              تغییر رمز عبور
            </p>
          </button>
        </section>

        <Button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          variant="ghost"
          className="w-full text-lg h-14 text-destructive hover:text-destructive/80 hover:bg-destructive/5"
        >
          <Trash2 className="size-5" aria-hidden />
          حذف حساب کاربری
        </Button>
      </form>

      <ResponsiveDialog
        open={passwordDialogOpen}
        onOpenChange={(open) => handlePasswordDialogOpenChange(Boolean(open))}
        size="md"
        className="text-right"
      >
        <ResponsiveDialog.Header className="text-right">
          <ResponsiveDialog.Title className="text-right">
            تغییر رمز عبور
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description className="text-right text-zinc-600 dark:text-zinc-400">
            رمز عبور جدید را دو بار وارد کنید. حداقل ۸ کاراکتر.
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <ResponsiveDialog.Content className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="new-password">رمز عبور جدید</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-new-password">تکرار رمز عبور جدید</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </ResponsiveDialog.Content>
        <ResponsiveDialog.Footer>
          <Button
            type="button"
            variant="outline"
            disabled={changePasswordMutation.isPending}
            onClick={() => handlePasswordDialogOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            disabled={changePasswordMutation.isPending}
            onClick={() => void submitChangePassword()}
          >
            {changePasswordMutation.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                در حال ذخیره…
              </>
            ) : (
              "ثبت رمز جدید"
            )}
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => handleDeleteDialogOpenChange(Boolean(open))}
        size="md"
        className="text-right"
      >
        <ResponsiveDialog.Header className="text-right">
          <ResponsiveDialog.Title className="text-right text-destructive">
            حذف حساب کاربری
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description className="text-right text-zinc-600">
            حساب شما غیرفعال می‌شود و از سیستم خارج می‌شوید. داده‌های بازی گذشته
            ممکن است به‌صورت ناشناس باقی بمانند.
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <ResponsiveDialog.Footer>
          <Button
            type="button"
            variant="outline"
            disabled={deleteAccountMutation.isPending}
            onClick={() => handleDeleteDialogOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteAccountMutation.isPending}
            onClick={() => void onDeleteAccount()}
          >
            {deleteAccountMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                در حال حذف…
              </>
            ) : (
              "حذف نهایی حساب"
            )}
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog>
    </div>
  );
}
