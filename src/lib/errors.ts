export type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION"
  | "BAD_STATE"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: { status?: number; expose?: boolean; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.expose = options.expose ?? true;
    this.status =
      options.status ??
      (code === "NOT_FOUND"
        ? 404
        : code === "FORBIDDEN"
          ? 403
          : code === "CONFLICT"
            ? 409
            : code === "BAD_STATE"
              ? 409
              : code === "VALIDATION"
                ? 400
                : 500);
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError && error.expose) {
    return error.message;
  }
  return "خطایی رخ داد. دوباره تلاش کنید.";
}
