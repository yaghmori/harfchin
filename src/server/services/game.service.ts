import { ALLOWED_PERSIAN_LETTERS, MIN_PLAYERS_TO_START } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import * as gameRepo from "@/server/repositories/game.repository";
import * as roomRepo from "@/server/repositories/room.repository";
import * as playerRepo from "@/server/repositories/player.repository";
import * as answerRepo from "@/server/repositories/answer.repository";
import * as categoryRepo from "@/server/repositories/category.repository";
import * as roundReadyRepo from "@/server/repositories/round-ready.repository";
import { validateAnswer } from "@/server/services/validation.service";
import * as scoringService from "@/server/services/scoring.service";
import { emitRoomUpdate } from "@/server/realtime/room-events";
import {
  assertGameStartable,
  assertRoomCanStartGame,
  assertRoundCanAdvance,
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

type ActiveGameWithPlayers = NonNullable<
  Awaited<ReturnType<typeof gameRepo.findLatestActiveGameForRoom>>
>;

async function ensureFullAnswerGridForRound(
  roundId: string,
  game: ActiveGameWithPlayers,
) {
  const categories = await categoryRepo.listActiveCategories();
  for (const p of game.room.players) {
    for (const cat of categories) {
      const existing = await prisma.roundAnswer.findUnique({
        where: {
          roundId_roomPlayerId_categoryId: {
            roundId,
            roomPlayerId: p.id,
            categoryId: cat.id,
          },
        },
      });
      if (existing) continue;
      await answerRepo.upsertRoundAnswer({
        roundId,
        roomPlayerId: p.id,
        categoryId: cat.id,
        value: "",
        normalizedValue: "",
        isValid: false,
      });
    }
  }
}

async function advanceAfterScoredRound(
  roomCode: string,
): Promise<{ finished: boolean; gameId: string }> {
  const room = await roomRepo.findRoomByCode(roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) {
    const done = await gameRepo.findLatestFinishedGameForRoom(room.id);
    if (!done) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");
    return { finished: true, gameId: done.id };
  }

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  await prisma.$transaction(async (tx) => {
    const r = await tx.round.findFirst({
      where: { id: round.id, gameId: game.id, status: "scored" },
    });
    if (!r) return;

    await tx.roundPlayerReady.deleteMany({ where: { roundId: r.id } });

    if (r.roundNumber >= game.totalRounds) {
      await tx.game.update({
        where: { id: game.id },
        data: { status: "finished" },
      });
      await tx.room.update({
        where: { id: room.id },
        data: { status: "finished" },
      });
      await tx.round.update({
        where: { id: r.id },
        data: { status: "finished" },
      });
      return;
    }

    const nextNum = r.roundNumber + 1;
    const letter = randomLetter();
    await tx.round.update({
      where: { id: r.id },
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

  emitRoomUpdate(roomCode);

  const latest = await gameRepo.findLatestGameForRoom(room.id);
  if (!latest) throw new AppError("BAD_STATE", "بازی یافت نشد.");
  if (latest.status === "finished") {
    return { finished: true, gameId: latest.id };
  }
  return { finished: false, gameId: latest.id };
}

async function finalizeRoundPipeline(
  roomCode: string,
): Promise<{ finished: boolean; gameId: string }> {
  const room = await roomRepo.findRoomByCode(roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) {
    const done = await gameRepo.findLatestFinishedGameForRoom(room.id);
    if (!done) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");
    return { finished: true, gameId: done.id };
  }

  const round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  if (round.status !== "active") {
    const latest = await gameRepo.findLatestGameForRoom(room.id);
    if (latest?.status === "finished") {
      return { finished: true, gameId: latest.id };
    }
    const lr = latest
      ? await gameRepo.findLatestRoundForGame(latest.id)
      : null;
    if (lr?.status === "active") {
      return { finished: false, gameId: latest!.id };
    }
    if (lr?.status === "review") {
      await scoringService.applyScoresForRound({
        gameId: latest!.id,
        roundId: lr.id,
        roomCode: room.code,
      });
      return advanceAfterScoredRound(roomCode);
    }
    if (lr?.status === "scored") {
      return advanceAfterScoredRound(roomCode);
    }
    return { finished: false, gameId: game.id };
  }

  await ensureFullAnswerGridForRound(round.id, game);

  const now = new Date();
  const updated = await prisma.round.updateMany({
    where: { id: round.id, status: "active" },
    data: { endedAt: now, status: "review" },
  });

  if (updated.count === 0) {
    emitRoomUpdate(room.code);
    const latestG = await gameRepo.findLatestGameForRoom(room.id);
    if (!latestG) throw new AppError("NOT_FOUND", "بازی یافت نشد.");
    const lr = await gameRepo.findLatestRoundForGame(latestG.id);
    if (latestG.status === "finished") {
      return { finished: true, gameId: latestG.id };
    }
    if (lr?.status === "active") {
      return { finished: false, gameId: latestG.id };
    }
    if (lr?.status === "review") {
      await scoringService.applyScoresForRound({
        gameId: latestG.id,
        roundId: lr.id,
        roomCode: room.code,
      });
      return advanceAfterScoredRound(roomCode);
    }
    if (lr?.status === "scored") {
      return advanceAfterScoredRound(roomCode);
    }
    return { finished: false, gameId: latestG.id };
  }

  await prisma.game.update({
    where: { id: game.id },
    data: { status: "review" },
  });

  await scoringService.applyScoresForRound({
    gameId: game.id,
    roundId: round.id,
    roomCode: room.code,
  });

  return advanceAfterScoredRound(roomCode);
}

async function maybeAutoEndRound(roundId: string): Promise<void> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { game: { include: { room: true } } },
  });
  if (!round || round.status !== "active") return;
  const endsMs = round.startedAt.getTime() + round.game.roundTimeSec * 1000;
  if (Date.now() < endsMs) return;
  await finalizeRoundPipeline(round.game.room.code);
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

  emitRoomUpdate(params.roomCode);
  return { gameId: game.id };
}

export async function finishRound(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند دور را پایان دهد.");
  }

  return finalizeRoundPipeline(params.roomCode);
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

  emitRoomUpdate(params.roomCode);
  return { ok: true as const };
}

export async function completeRound(params: {
  userId: string;
  roomCode: string;
  answers: { categoryKey: string; value: string }[];
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const game = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (!game) throw new AppError("NOT_FOUND", "بازی فعالی نیست.");

  let round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round) throw new AppError("BAD_STATE", "دوری یافت نشد.");

  await maybeAutoEndRound(round.id);

  round = await gameRepo.findLatestRoundForGame(game.id);
  if (!round || round.status !== "active") {
    const latestG = await gameRepo.findLatestGameForRoom(room.id);
    if (!latestG) {
      throw new AppError("BAD_STATE", "بازی یافت نشد.");
    }
    if (latestG.status === "finished") {
      return {
        outcome: "game_finished" as const,
        gameId: latestG.id,
      };
    }
    return {
      outcome: "round_advanced" as const,
      gameId: latestG.id,
    };
  }

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما در این بازی نیستید.");

  const isHost = room.hostId === params.userId;
  const categories = await categoryRepo.listActiveCategories();
  const byKey = new Map(categories.map((c) => [c.key, c]));

  if (!isHost) {
    if (params.answers.length !== categories.length) {
      throw new AppError("VALIDATION", "همه ردیف‌ها را پر کنید.");
    }
    const keys = new Set(params.answers.map((a) => a.categoryKey));
    if (keys.size !== categories.length) {
      throw new AppError("VALIDATION", "همه ردیف‌ها را پر کنید.");
    }
    for (const c of categories) {
      const row = params.answers.find((a) => a.categoryKey === c.key);
      if (!row || row.value.trim().length === 0) {
        throw new AppError("VALIDATION", "همه فیلدها را پر کنید.");
      }
    }
  }

  for (const row of params.answers) {
    const cat = byKey.get(row.categoryKey);
    if (!cat) continue;
    const v = validateAnswer(row.value, round.letter);
    await answerRepo.upsertRoundAnswer({
      roundId: round.id,
      roomPlayerId: rp.id,
      categoryId: cat.id,
      value: row.value.trim(),
      normalizedValue: v.normalized,
      isValid: v.isValid,
    });
  }

  if (isHost) {
    const out = await finalizeRoundPipeline(room.code);
    return {
      outcome: out.finished
        ? ("game_finished" as const)
        : ("round_advanced" as const),
      gameId: out.gameId,
    };
  }

  await roundReadyRepo.markRoundPlayerReady(round.id, rp.id);
  const ready = await roundReadyRepo.countRoundPlayerReadies(round.id);
  const total = game.room.players.length;

  if (ready < total) {
    emitRoomUpdate(room.code);
    return {
      outcome: "waiting_for_players" as const,
      readyCount: ready,
      totalPlayers: total,
    };
  }

  const out = await finalizeRoundPipeline(room.code);
  return {
    outcome: out.finished
      ? ("game_finished" as const)
      : ("round_advanced" as const),
    gameId: out.gameId,
  };
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
    emitRoomUpdate(params.roomCode);
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

  emitRoomUpdate(params.roomCode);
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
    game.status === "review" ||
    r2.status === "review" ||
    r2.status === "scored" ||
    (r2.status === "active" && ended)
      ? ("processing_round" as const)
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

  let players: {
    id: string;
    displayName: string;
    isHost: boolean;
    answers: {
      categoryKey: string;
      value: string;
      normalizedValue: string;
      isValid: boolean;
      score: number;
    }[];
  }[] = [];

  if (round) {
    const allAnswers = await answerRepo.listAnswersForRound(round.id);
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

    players = game.room.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      answers: answersByPlayer.get(p.id) ?? [],
    }));
  }

  type RoundPlayerPayload = (typeof players)[number];

  const roundsSummary: {
    roundNumber: number;
    letter: string;
    players: RoundPlayerPayload[];
  }[] = [];

  if (game.status === "finished") {
    const allRounds = await gameRepo.listRoundsForGame(game.id);
    for (const r of allRounds) {
      const allAnswers = await answerRepo.listAnswersForRound(r.id);
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
      const roundPlayers = game.room.players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        isHost: p.isHost,
        answers: answersByPlayer.get(p.id) ?? [],
      }));
      roundsSummary.push({
        roundNumber: r.roundNumber,
        letter: r.letter,
        players: roundPlayers,
      });
    }
  }

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
    players,
    roundsSummary,
  };
}
