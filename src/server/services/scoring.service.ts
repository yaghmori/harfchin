import { prisma } from "@/lib/prisma";
import { scoreCategoryAnswers } from "@/domain/rules/scoring";
import type { ScoringEntry } from "@/domain/rules/scoring";
import * as gameRepo from "@/server/repositories/game.repository";
import * as answerRepo from "@/server/repositories/answer.repository";
import * as categoryRepo from "@/server/repositories/category.repository";
import { assertRoundCanScore } from "@/server/rules/game-transitions";
import { AppError } from "@/lib/errors";
import { emitRoomUpdate } from "@/server/realtime/room-events";

/**
 * Applies per-category scoring for a round in `review` and sets round to `scored`.
 * Server-only; does not enforce host (used by automated round completion).
 */
export async function applyScoresForRound(params: {
  gameId: string;
  roundId: string;
  roomCode: string;
}): Promise<{ alreadyScored: true; roundId: string } | { alreadyScored: false; roundId: string }> {
  const round = await prisma.round.findUnique({
    where: { id: params.roundId },
  });
  if (!round) throw new AppError("NOT_FOUND", "دور پیدا نشد.");
  if (round.gameId !== params.gameId) {
    throw new AppError("BAD_STATE", "عدم تطابق بازی و دور.");
  }

  if (round.status === "scored") {
    return { alreadyScored: true as const, roundId: round.id };
  }

  assertRoundCanScore(round.status);

  const categories = await categoryRepo.listActiveCategories();
  const answers = await answerRepo.listAnswersForRound(round.id);

  await prisma.$transaction(async (tx) => {
    const playerScoresRows = await tx.playerScore.findMany({
      where: { gameId: params.gameId },
    });

    for (const cat of categories) {
      const catAnswers = answers.filter((a) => a.categoryId === cat.id);
      const entries: ScoringEntry[] = playerScoresRows.map((ps) => {
        const ans = catAnswers.find((a) => a.roomPlayerId === ps.roomPlayerId);
        if (!ans) {
          return {
            roomPlayerId: ps.roomPlayerId,
            normalized: "",
            isValid: false,
          };
        }
        return {
          roomPlayerId: ans.roomPlayerId,
          normalized: ans.normalizedValue,
          isValid: ans.isValid,
        };
      });

      const scoresMap = scoreCategoryAnswers(entries, {
        pointsSoloBonus: cat.pointsSoloBonus,
        pointsUnique: cat.pointsUnique,
        pointsDuplicate: cat.pointsDuplicate,
      });

      for (const ans of catAnswers) {
        const s = scoresMap.get(ans.roomPlayerId) ?? 0;
        await tx.roundAnswer.update({
          where: { id: ans.id },
          data: { score: s },
        });
      }

      for (const ps of playerScoresRows) {
        const add = scoresMap.get(ps.roomPlayerId) ?? 0;
        if (add === 0) continue;
        await tx.playerScore.update({
          where: { id: ps.id },
          data: { totalScore: { increment: add } },
        });
      }
    }

    await tx.round.update({
      where: { id: round.id },
      data: { status: "scored" },
    });
  });

  emitRoomUpdate(params.roomCode);
  return { alreadyScored: false as const, roundId: round.id };
}

export async function scoreCurrentRound(roomCode: string, hostUserId: string) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
  });
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  if (room.hostId !== hostUserId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند امتیازدهی کند.");
  }

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  return applyScoresForRound({
    gameId: game.id,
    roundId: round.id,
    roomCode: room.code,
  });
}
