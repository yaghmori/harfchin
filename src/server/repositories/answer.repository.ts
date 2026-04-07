import { prisma } from "@/lib/prisma";

export async function upsertRoundAnswer(params: {
  roundId: string;
  roomPlayerId: string;
  categoryId: string;
  value: string;
  normalizedValue: string;
  isValid: boolean;
}) {
  const { roundId, roomPlayerId, categoryId, value, normalizedValue, isValid } =
    params;
  return prisma.roundAnswer.upsert({
    where: {
      roundId_roomPlayerId_categoryId: {
        roundId,
        roomPlayerId,
        categoryId,
      },
    },
    create: {
      roundId,
      roomPlayerId,
      categoryId,
      value,
      normalizedValue,
      isValid,
      score: 0,
    },
    update: {
      value,
      normalizedValue,
      isValid,
      submittedAt: new Date(),
    },
  });
}

export async function listAnswersForRound(roundId: string) {
  return prisma.roundAnswer.findMany({
    where: { roundId },
    include: { category: true, roomPlayer: true },
  });
}
