import { prisma } from "@/lib/prisma";

export async function markRoundPlayerReady(
  roundId: string,
  roomPlayerId: string,
) {
  return prisma.roundPlayerReady.upsert({
    where: {
      roundId_roomPlayerId: { roundId, roomPlayerId },
    },
    create: { roundId, roomPlayerId },
    update: {},
  });
}

export async function countRoundPlayerReadies(roundId: string) {
  return prisma.roundPlayerReady.count({ where: { roundId } });
}

export async function deleteReadiesForRound(roundId: string) {
  return prisma.roundPlayerReady.deleteMany({ where: { roundId } });
}
