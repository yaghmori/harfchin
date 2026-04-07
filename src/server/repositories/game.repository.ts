import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findGameById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      rounds: { orderBy: { roundNumber: "desc" }, take: 1 },
      playerScores: { include: { roomPlayer: true } },
      room: { include: { players: true } },
    },
  });
}

export async function findLatestActiveGameForRoom(roomId: string) {
  return prisma.game.findFirst({
    where: {
      roomId,
      status: { in: ["pending", "in_progress", "review"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      rounds: { orderBy: { roundNumber: "desc" } },
      playerScores: { include: { roomPlayer: true } },
      room: { include: { players: { orderBy: { joinedAt: "asc" } } } },
    },
  });
}

export async function findLatestFinishedGameForRoom(roomId: string) {
  return prisma.game.findFirst({
    where: { roomId, status: "finished" },
    orderBy: { createdAt: "desc" },
  });
}

const gameWithRelations = {
  rounds: { orderBy: { roundNumber: "desc" as const } },
  playerScores: { include: { roomPlayer: true } },
  room: { include: { players: { orderBy: { joinedAt: "asc" as const } } } },
} as const;

export async function findLatestGameForRoom(roomId: string) {
  return prisma.game.findFirst({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: gameWithRelations,
  });
}

export async function createGame(data: Prisma.GameCreateInput) {
  return prisma.game.create({ data });
}

export async function updateGame(gameId: string, data: Prisma.GameUpdateInput) {
  return prisma.game.update({ where: { id: gameId }, data });
}

export async function createRound(data: Prisma.RoundCreateInput) {
  return prisma.round.create({ data });
}

export async function updateRound(roundId: string, data: Prisma.RoundUpdateInput) {
  return prisma.round.update({ where: { id: roundId }, data });
}

export async function findRoundById(roundId: string) {
  return prisma.round.findUnique({
    where: { id: roundId },
    include: {
      game: true,
      answers: { include: { category: true, roomPlayer: true } },
    },
  });
}

export async function findLatestRoundForGame(gameId: string) {
  return prisma.round.findFirst({
    where: { gameId },
    orderBy: { roundNumber: "desc" },
    include: { game: true },
  });
}

export async function listRoundsForGame(gameId: string) {
  return prisma.round.findMany({
    where: { gameId },
    orderBy: { roundNumber: "asc" },
  });
}
