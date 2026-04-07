import { ALLOWED_PERSIAN_LETTERS, MIN_PLAYERS_TO_START } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import * as gameRepo from "@/server/repositories/game.repository";
import * as roomRepo from "@/server/repositories/room.repository";
import * as playerRepo from "@/server/repositories/player.repository";
import * as answerRepo from "@/server/repositories/answer.repository";
import * as categoryRepo from "@/server/repositories/category.repository";
import { validateAnswer } from "@/server/services/validation.service";
import {
  assertGameStartable,
  assertRoomCanStartGame,
  assertRoundCanAdvance,
  assertRoundCanFinish,
  assertRoundCanSubmit,
} from "@/server/rules/game-transitions";

function randomLetter(): string {
  const i = Math.floor(Math.random() * ALLOWED_PERSIAN_LETTERS.length);
  return ALLOWED_PERSIAN_LETTERS[i]!;
}

function roundTimeEnded(
  startedAt: Date,
  roundTimeSec: number,
  endedAt: Date | null,
): boolean {
  if (endedAt) return true;
  const endsMs = startedAt.getTime() + roundTimeSec * 1000;
  return Date.now() >= endsMs;
}

async function maybeAutoEndRound(roundId: string): Promise<void> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { game: true },
  });
  if (!round || round.status !== "active") return;
  const endsMs = round.startedAt.getTime() + round.game.roundTimeSec * 1000;
  if (Date.now() < endsMs) return;
  await prisma.$transaction([
    prisma.round.update({
      where: { id: round.id },
      data: { endedAt: new Date(endsMs), status: "review" },
    }),
    prisma.game.update({
      where: { id: round.gameId },
      data: { status: "review" },
    }),
  ]);
}

export async function startGame(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند بازی را شروع کند.");
  }

  assertRoomCanStartGame(room.status);

  const active = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (active) {
    throw new AppError("CONFLICT", "یک بازی فعال از قبل وجود دارد.");
  }

  const players = room.players;
  const readyCount = players.filter((p) => p.isReady).length;

  assertGameStartable(
    "pending",
    players.length,
    readyCount,
    MIN_PLAYERS_TO_START,
  );

  const letter = randomLetter();

  const game = await prisma.$transaction(async (tx) => {
    const g = await tx.game.create({
      data: {
        roomId: room.id,
        status: "in_progress",
        currentRound: 1,
        totalRounds: room.draftTotalRounds,
        roundTimeSec: room.draftRoundTimeSec,
        playerScores: {
          create: players.map((p) => ({
            roomPlayerId: p.id,
            totalScore: 0,
          })),
        },
      },
    });

    await tx.round.create({
      data: {
        gameId: g.id,
        roundNumber: 1,
        letter,
        status: "active",
      },
    });

    await tx.room.update({
      where: { id: room.id },
      data: { status: "playing" },
    });

    return g;
  });

  return { gameId: game.id };
}

export async function finishRound(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند دور را پایان دهد.");
  }

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  if (round.status === "review" || round.status === "scored") {
    return { roundId: round.id };
  }

  assertRoundCanFinish(round.status);

  const now = new Date();
  await prisma.$transaction([
    prisma.round.update({
      where: { id: round.id },
      data: { endedAt: now, status: "review" },
    }),
    prisma.game.update({
      where: { id: game.id },
      data: { status: "review" },
    }),
  ]);

  return { roundId: round.id };
}

export async function submitAnswers(params: {
  userId: string;
  roomCode: string;
  answers: { categoryKey: string; value: string }[];
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  await maybeAutoEndRound(round.id);

  const refreshed = await gameRepo.findLatestRoundForGame(game.id);
  if (!refreshed) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  const ended =
    refreshed.endedAt != null ||
    roundTimeEnded(
      refreshed.startedAt,
      refreshed.game.roundTimeSec,
      refreshed.endedAt,
    );

  assertRoundCanSubmit(refreshed.status, ended);

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما در این بازی نیستید.");

  const categories = await categoryRepo.listActiveCategories();
  const byKey = new Map(categories.map((c) => [c.key, c]));

  for (const row of params.answers) {
    const cat = byKey.get(row.categoryKey);
    if (!cat) continue;
    const v = validateAnswer(row.value, refreshed.letter);
    await answerRepo.upsertRoundAnswer({
      roundId: refreshed.id,
      roomPlayerId: rp.id,
      categoryId: cat.id,
      value: row.value.trim(),
      normalizedValue: v.normalized,
      isValid: v.isValid,
    });
  }

  return { ok: true as const };
}

export async function nextRound(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند دور بعد را آغاز کند.");
  }

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  assertRoundCanAdvance(round.status);

  if (round.roundNumber >= game.totalRounds) {
    await prisma.$transaction([
      prisma.game.update({
        where: { id: game.id },
        data: { status: "finished" },
      }),
      prisma.room.update({
        where: { id: room.id },
        data: { status: "finished" },
      }),
    ]);
    return { finished: true as const, gameId: game.id };
  }

  const nextNum = round.roundNumber + 1;
  const letter = randomLetter();

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: round.id },
      data: { status: "finished" },
    });

    await tx.round.create({
      data: {
        gameId: game.id,
        roundNumber: nextNum,
        letter,
        status: "active",
      },
    });

    await tx.game.update({
      where: { id: game.id },
      data: {
        status: "in_progress",
        currentRound: nextNum,
      },
    });
  });

  return { finished: false as const, gameId: game.id };
}

export async function getGameStateByRoomCode(roomCode: string) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
  });
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const game = await gameRepo.findLatestGameForRoom(room.id);
  if (!game) {
    return {
      phase: "none" as const,
      roomStatus: room.status,
      hostUserId: room.hostId,
      game: null,
    };
  }

  if (game.status === "finished") {
    const lastRound = await gameRepo.findLatestRoundForGame(game.id);
    const categories = await categoryRepo.listActiveCategories();
    const allAnswers = lastRound
      ? await answerRepo.listAnswersForRound(lastRound.id)
      : [];

    const answersByPlayer = new Map<
      string,
      {
        categoryKey: string;
        value: string;
        normalizedValue: string;
        isValid: boolean;
        score: number;
      }[]
    >();

    for (const a of allAnswers) {
      const list = answersByPlayer.get(a.roomPlayerId) ?? [];
      list.push({
        categoryKey: a.category.key,
        value: a.value,
        normalizedValue: a.normalizedValue,
        isValid: a.isValid,
        score: a.score,
      });
      answersByPlayer.set(a.roomPlayerId, list);
    }

    const players = game.room.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      answers: answersByPlayer.get(p.id) ?? [],
    }));

    const leaderboard = game.playerScores
      .map((ps) => ({
        roomPlayerId: ps.roomPlayerId,
        displayName: ps.roomPlayer.displayName,
        totalScore: ps.totalScore,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    return {
      phase: "finished" as const,
      roomStatus: room.status,
      hostUserId: room.hostId,
      game: {
        id: game.id,
        status: game.status,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        roundTimeSec: game.roundTimeSec,
      },
      round: lastRound
        ? {
            id: lastRound.id,
            roundNumber: lastRound.roundNumber,
            letter: lastRound.letter,
            status: lastRound.status,
            startedAt: lastRound.startedAt.toISOString(),
            endedAt: lastRound.endedAt?.toISOString() ?? null,
            endsAt: new Date(
              lastRound.startedAt.getTime() + game.roundTimeSec * 1000,
            ).toISOString(),
          }
        : null,
      players,
      leaderboard,
      categories: categories.map((c) => ({ key: c.key, title: c.title })),
    };
  }

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) {
    return {
      phase: "none" as const,
      roomStatus: room.status,
      hostUserId: room.hostId,
      game: { id: game.id, status: game.status },
    };
  }

  await maybeAutoEndRound(round.id);

  const r2 = await gameRepo.findLatestRoundForGame(game.id);
  if (!r2) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  const endsAt = new Date(
    r2.startedAt.getTime() + r2.game.roundTimeSec * 1000,
  ).toISOString();

  const ended =
    r2.endedAt != null ||
    roundTimeEnded(r2.startedAt, r2.game.roundTimeSec, r2.endedAt);

  const categories = await categoryRepo.listActiveCategories();
  const allAnswers = await answerRepo.listAnswersForRound(r2.id);

  const phase =
    r2.status === "active"
      ? ended
        ? ("review" as const)
        : ("playing" as const)
      : r2.status === "review"
        ? ("review" as const)
        : r2.status === "scored"
          ? ("between" as const)
          : ("playing" as const);

  const answersByPlayer = new Map<
    string,
    { categoryKey: string; value: string; normalizedValue: string; isValid: boolean; score: number }[]
  >();

  for (const a of allAnswers) {
    const list = answersByPlayer.get(a.roomPlayerId) ?? [];
    list.push({
      categoryKey: a.category.key,
      value: a.value,
      normalizedValue: a.normalizedValue,
      isValid: a.isValid,
      score: a.score,
    });
    answersByPlayer.set(a.roomPlayerId, list);
  }

  const players = game.room.players.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isHost: p.isHost,
    answers: answersByPlayer.get(p.id) ?? [],
  }));

  const leaderboard = game.playerScores
    .map((ps) => ({
      roomPlayerId: ps.roomPlayerId,
      displayName: ps.roomPlayer.displayName,
      totalScore: ps.totalScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    phase,
    roomStatus: room.status,
    hostUserId: room.hostId,
    game: {
      id: game.id,
      status: game.status,
      currentRound: game.currentRound,
      totalRounds: game.totalRounds,
      roundTimeSec: game.roundTimeSec,
    },
    round: {
      id: r2.id,
      roundNumber: r2.roundNumber,
      letter: r2.letter,
      status: r2.status,
      startedAt: r2.startedAt.toISOString(),
      endedAt: r2.endedAt?.toISOString() ?? null,
      endsAt,
    },
    players,
    leaderboard,
    categories: categories.map((c) => ({ key: c.key, title: c.title })),
  };
}

export async function getGameStateByGameId(gameId: string) {
  const game = await gameRepo.findGameById(gameId);
  if (!game) throw new AppError("NOT_FOUND", "بازی پیدا نشد.");

  const round =
    game.rounds[0] ??
    (await gameRepo.findLatestRoundForGame(game.id));

  const categories = await categoryRepo.listActiveCategories();
  const leaderboard = game.playerScores
    .map((ps) => ({
      roomPlayerId: ps.roomPlayerId,
      displayName: ps.roomPlayer.displayName,
      totalScore: ps.totalScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    hostUserId: game.room.hostId,
    roomCode: game.room.code,
    game: {
      id: game.id,
      status: game.status,
      currentRound: game.currentRound,
      totalRounds: game.totalRounds,
      roundTimeSec: game.roundTimeSec,
    },
    round: round
      ? {
          id: round.id,
          roundNumber: round.roundNumber,
          letter: round.letter,
          status: round.status,
        }
      : null,
    leaderboard,
    categories: categories.map((c) => ({ key: c.key, title: c.title })),
  };
}
