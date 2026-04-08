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
