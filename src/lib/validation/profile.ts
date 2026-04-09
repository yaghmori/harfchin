import { z } from "zod";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/constants";

export const updateProfileBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام نمایشی را وارد کنید.")
    .max(
      MAX_DISPLAY_NAME_LENGTH,
      `نام نمایشی حداکثر ${MAX_DISPLAY_NAME_LENGTH} کاراکتر باشد.`,
    ),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const changePasswordBodySchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد."),
    confirmNewPassword: z
      .string()
      .min(1, "تکرار رمز عبور جدید را وارد کنید."),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "رمز جدید و تکرار آن یکسان نیستند.",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
