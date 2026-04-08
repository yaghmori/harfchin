import type {
  GameStatus,
  RoomStatus,
  RoundStatus,
} from "@/generated/prisma";
import { AppError } from "@/lib/errors";

export function assertRoomCanStartGame(status: RoomStatus): void {
  if (status !== "waiting") {
    throw new AppError("BAD_STATE", "اتاق در وضعیت شروع بازی نیست.");
  }
}

export function assertGameStartable(
  status: GameStatus,
  playerCount: number,
  readyCount: number,
  minPlayers: number,
): void {
  if (status !== "pending") {
    throw new AppError("BAD_STATE", "بازی از قبل شروع شده است.");
  }
  if (playerCount < minPlayers) {
    throw new AppError("BAD_STATE", "حداقل تعداد بازیکن برای شروع رعایت نشده است.");
  }
  if (readyCount !== playerCount) {
    throw new AppError("BAD_STATE", "همه بازیکنان باید آماده باشند.");
  }
}

export function assertRoundCanSubmit(roundStatus: RoundStatus, roundEnded: boolean): void {
  if (roundStatus !== "active" || roundEnded) {
    throw new AppError("BAD_STATE", "ارسال پاسخ برای این دور مجاز نیست.");
  }
}

export function assertRoundCanFinish(roundStatus: RoundStatus): void {
  if (roundStatus !== "active") {
    throw new AppError("BAD_STATE", "این دور قبلاً پایان یافته است.");
  }
}

export function assertRoundCanScore(roundStatus: RoundStatus): void {
  if (roundStatus !== "review") {
    throw new AppError("BAD_STATE", "امتیازدهی فقط پس از پایان دور ممکن است.");
  }
}

export function assertRoundCanAdvance(roundStatus: RoundStatus): void {
  if (roundStatus !== "scored") {
    throw new AppError("BAD_STATE", "ابتدا باید امتیاز دور محاسبه شود.");
  }
}
