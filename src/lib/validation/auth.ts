import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "ایمیل را وارد کنید.")
    .email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export const signupBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "ایمیل را وارد کنید.")
      .email("ایمیل معتبر نیست."),
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
    confirmPassword: z.string().min(1, "تکرار رمز را وارد کنید."),
    name: z
      .string()
      .trim()
      .min(1, "نام نمایشی را وارد کنید.")
      .max(64, "نام نمایشی خیلی طولانی است."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "رمز و تکرار آن یکسان نیستند.",
    path: ["confirmPassword"],
  });

export type LoginBody = z.infer<typeof loginBodySchema>;
export type SignupBody = z.infer<typeof signupBodySchema>;
