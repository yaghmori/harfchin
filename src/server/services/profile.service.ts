import { GameStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type ProfileRecentGame = {
  id: string;
  title: string;
  subtitle: string;
  resultLabel: string;
  resultTone: "win" | "podium" | "loss" | "neutral";
  points: number;
  at: string;
};

export type ProfileAchievement = {
  key: string;
  titleFa: string;
  icon: "zap" | "trophy" | "target" | "flame";
  progressPercent: number;
};

function levelFromTotalScore(total: number): number {
  return Math.max(1, Math.floor(total / 500) + 1);
}

/** Relative / absolute time labels in Persian-friendly short form. */
function formatGameTime(d: Date): string {
  const now = Date.now();
  const t = d.getTime();
  const dayMs = 86400000;
  const diffDays = Math.floor((now - t) / dayMs);
  const timeStr = d.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffDays <= 0) return `امروز، ${timeStr}`;
  if (diffDays === 1) return `دیروز، ${timeStr}`;
  if (diffDays < 7) return `${diffDays} روز پیش`;
  return d.toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
}

export async function getProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isGuest: true,
      createdAt: true,
    },
  });
  if (!user || user.isGuest) return null;

  const roomPlayers = await prisma.roomPlayer.findMany({
    where: { userId },
    select: { id: true },
  });
  const rpIds = roomPlayers.map((r) => r.id);

  if (rpIds.length === 0) {
    return {
      user,
      totalScore: 0,
      gamesCount: 0,
      winsCount: 0,
      level: 1,
      memberSinceLabel: formatMemberSince(user.createdAt),
      recentGames: [] as ProfileRecentGame[],
      achievements: buildAchievements(0, 0, 0),
    };
  }

  const sumRow = await prisma.playerScore.aggregate({
    where: { roomPlayerId: { in: rpIds } },
    _sum: { totalScore: true },
  });
  const totalScore = sumRow._sum.totalScore ?? 0;

  const distinctGames = await prisma.playerScore.findMany({
    where: { roomPlayerId: { in: rpIds } },
    distinct: ["gameId"],
    select: { gameId: true },
  });
  const gamesCount = distinctGames.length;

  const finishedWithScores = await prisma.game.findMany({
    where: {
      status: GameStatus.finished,
      playerScores: { some: { roomPlayerId: { in: rpIds } } },
    },
    select: {
      id: true,
      playerScores: {
        select: {
          totalScore: true,
          roomPlayer: { select: { userId: true } },
        },
      },
    },
  });

  let winsCount = 0;
  for (const g of finishedWithScores) {
    if (g.playerScores.length === 0) continue;
    const max = Math.max(...g.playerScores.map((p) => p.totalScore));
    const leaders = g.playerScores.filter((p) => p.totalScore === max);
    if (
      leaders.length === 1 &&
      leaders[0].roomPlayer.userId === userId
    ) {
      winsCount++;
    }
  }

  const recent = await prisma.game.findMany({
    where: {
      playerScores: { some: { roomPlayerId: { in: rpIds } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      room: { select: { title: true, code: true } },
      playerScores: {
        include: {
          roomPlayer: { select: { userId: true, displayName: true } },
        },
      },
    },
  });

  const recentGames: ProfileRecentGame[] = recent.map((game) => {
    const mine = game.playerScores.filter(
      (p) => p.roomPlayer.userId === userId,
    );
    const myScore = mine[0]?.totalScore ?? 0;
    const others = game.playerScores
      .filter((p) => p.roomPlayer.userId !== userId)
      .map((p) => p.roomPlayer.displayName);
    const title =
      game.room.title?.trim() ||
      `اتاق ${game.room.code}`;
    const subtitle =
      others.length > 0
        ? `بازی با ${others.slice(0, 2).join("، ")}`
        : "بازی گروهی";

    const sorted = [...game.playerScores].sort(
      (a, b) => b.totalScore - a.totalScore,
    );
    const rank =
      sorted.findIndex((p) => p.roomPlayer.userId === userId) + 1;
    const n = sorted.length;

    let resultLabel: string;
    let resultTone: ProfileRecentGame["resultTone"];
    if (game.status !== GameStatus.finished) {
      resultLabel = "در جریان";
      resultTone = "neutral";
    } else if (rank === 1 && n > 1) {
      resultLabel = "پیروز";
      resultTone = "win";
    } else if (rank === 2) {
      resultLabel = "مقام دوم";
      resultTone = "podium";
    } else if (rank > 2) {
      resultLabel = "باخت";
      resultTone = "loss";
    } else {
      resultLabel = "پایان";
      resultTone = "neutral";
    }

    return {
      id: game.id,
      title,
      subtitle,
      resultLabel,
      resultTone,
      points: myScore,
      at: formatGameTime(game.updatedAt),
    };
  });

  const level = levelFromTotalScore(totalScore);

  return {
    user,
    totalScore,
    gamesCount,
    winsCount,
    level,
    memberSinceLabel: formatMemberSince(user.createdAt),
    recentGames,
    achievements: buildAchievements(totalScore, gamesCount, winsCount),
  };
}

function formatMemberSince(createdAt: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
    }).formatToParts(createdAt);
    const y = parts.find((p) => p.type === "year")?.value ?? "";
    const m = parts.find((p) => p.type === "month")?.value ?? "";
    return `عضویت از ${m} ${y}`;
  } catch {
    return `عضویت از ${createdAt.toLocaleDateString("fa-IR")}`;
  }
}

function buildAchievements(
  totalScore: number,
  gamesCount: number,
  winsCount: number,
): ProfileAchievement[] {
  return [
    {
      key: "fast",
      titleFa: "سریع",
      icon: "zap",
      progressPercent: Math.min(100, gamesCount * 12 + 15),
    },
    {
      key: "hero",
      titleFa: "قهرمان",
      icon: "trophy",
      progressPercent: Math.min(100, winsCount * 18 + 10),
    },
    {
      key: "collector",
      titleFa: "جمع‌آور امتیاز",
      icon: "target",
      progressPercent: Math.min(100, Math.floor(totalScore / 80)),
    },
    {
      key: "streak",
      titleFa: "پشت‌سرهم",
      icon: "flame",
      progressPercent: Math.min(100, gamesCount * 8 + winsCount * 5),
    },
  ];
}
