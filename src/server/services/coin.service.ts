import { prisma } from "@/lib/prisma";

const PARTICIPATION_COINS = 10;
const BONUS_BY_RANK: Record<number, number> = {
  1: 20,
  2: 10,
  3: 5,
};

function bonusForRank(rank: number): number {
  return BONUS_BY_RANK[rank] ?? 0;
}

export async function awardCoinsForFinishedGame(gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      room: {
        include: {
          players: {
            select: { id: true, userId: true, displayName: true },
          },
        },
      },
      playerScores: {
        select: { roomPlayerId: true, totalScore: true },
      },
    },
  });
  if (!game || game.status !== "finished" || game.coinsAwardedAt) return;

  const scoreByPlayer = new Map(
    game.playerScores.map((s) => [s.roomPlayerId, s.totalScore]),
  );

  const ranked = game.room.players
    .map((p) => ({
      roomPlayerId: p.id,
      userId: p.userId,
      displayName: p.displayName,
      score: scoreByPlayer.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  let currentRank = 0;
  let previousScore: number | null = null;
  const rankByRoomPlayerId = new Map<string, number>();
  for (let i = 0; i < ranked.length; i++) {
    const row = ranked[i]!;
    if (previousScore === null || row.score < previousScore) {
      currentRank = i + 1;
      previousScore = row.score;
    }
    rankByRoomPlayerId.set(row.roomPlayerId, currentRank);
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.game.findUnique({
      where: { id: gameId },
      select: { coinsAwardedAt: true, status: true },
    });
    if (!fresh || fresh.status !== "finished" || fresh.coinsAwardedAt) return;

    for (const row of ranked) {
      const rank = rankByRoomPlayerId.get(row.roomPlayerId) ?? 999;
      const amount = PARTICIPATION_COINS + bonusForRank(rank);
      if (amount <= 0) continue;

      const wallet = await tx.userCoinWallet.upsert({
        where: { userId: row.userId },
        create: {
          userId: row.userId,
          balance: amount,
          totalEarned: amount,
          totalSpent: 0,
        },
        update: {
          balance: { increment: amount },
          totalEarned: { increment: amount },
        },
        select: { id: true },
      });

      await tx.coinLedger.create({
        data: {
          walletId: wallet.id,
          userId: row.userId,
          gameId,
          amount,
          type: "game_reward",
          description: `پاداش پایان بازی (${row.displayName})`,
        },
      });
    }

    await tx.game.update({
      where: { id: gameId },
      data: { coinsAwardedAt: new Date() },
    });
  });
}
