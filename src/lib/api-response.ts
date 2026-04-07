import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, toUserMessage } from "@/lib/errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string };
};

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonErr(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiFailure> {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function handleRouteError(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ZodError) {
    return jsonErr("VALIDATION", "ورودی نامعتبر است.", 400);
  }
  if (error instanceof AppError) {
    return jsonErr(error.code, error.message, error.status);
  }
  console.error("[api]", error);
  return jsonErr("INTERNAL", toUserMessage(error), 500);
}
