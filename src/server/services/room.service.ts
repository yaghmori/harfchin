import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_ROOM_TITLE_LENGTH,
  MIN_PLAYERS_TO_START,
} from "@/lib/constants";
import type { DirectoryRoom } from "@/lib/room-directory";
import { AppError } from "@/lib/errors";
import { generateRoomCode } from "@/lib/room-code";
import * as chatRepo from "@/server/repositories/room-chat.repository";
import * as roomRepo from "@/server/repositories/room.repository";
import * as playerRepo from "@/server/repositories/player.repository";
import * as gameRepo from "@/server/repositories/game.repository";
import * as userRepo from "@/server/repositories/user.repository";
import { emitRoomUpdate } from "@/server/realtime/room-events";

function normalizeDisplayName(name: string): string {
  const t = name.trim();
  if (t.length === 0) throw new AppError("VALIDATION", "نام نمایشی الزامی است.");
  if (t.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new AppError("VALIDATION", "نام نمایشی خیلی طولانی است.");
  }
  return t;
}

async function uniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateRoomCode();
    const existing = await roomRepo.findRoomByCode(code);
    if (!existing) return code;
  }
  throw new AppError("INTERNAL", "ساخت کد اتاق ناموفق بود.");
}

export async function createRoom(params: {
  userId: string;
  title: string;
  displayName?: string;
  isPrivate?: boolean;
  maxPlayers?: number;
  draftTotalRounds?: number;
  draftRoundTimeSec?: number;
}) {
  const title = params.title.trim();
  if (title.length === 0) {
    throw new AppError("VALIDATION", "نام اتاق الزامی است.");
  }
  const displaySource = (params.displayName ?? title).trim();
  const displayName = normalizeDisplayName(
    displaySource.slice(0, MAX_DISPLAY_NAME_LENGTH),
  );
  const maxPlayers = Math.min(
    16,
    Math.max(2, params.maxPlayers ?? 8),
  );
  const draftTotalRounds = Math.min(
    20,
    Math.max(1, params.draftTotalRounds ?? 5),
  );
  const draftRoundTimeSec = Math.min(
    600,
    Math.max(30, params.draftRoundTimeSec ?? 120),
  );

  const code = await uniqueRoomCode();

  const roomTitle = title.slice(0, MAX_ROOM_TITLE_LENGTH);
  const isPrivate = params.isPrivate ?? false;

  const room = await roomRepo.createRoom({
    code,
    title: roomTitle,
    isPrivate,
    maxPlayers,
    draftTotalRounds,
    draftRoundTimeSec,
    host: { connect: { id: params.userId } },
    players: {
      create: {
        userId: params.userId,
        displayName,
        isHost: true,
        isReady: false,
      },
    },
  });

  await userRepo.updateUserName(params.userId, displayName);

  return { roomCode: room.code, roomId: room.id };
}

export async function joinRoom(params: {
  userId: string;
  roomCode: string;
  displayName: string;
}) {
  const displayName = normalizeDisplayName(params.displayName);
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) {
    throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  }

  const existing = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (existing) {
    await playerRepo.updateRoomPlayer(existing.id, { displayName });
    await userRepo.updateUserName(params.userId, displayName);
    emitRoomUpdate(room.code);
    return { roomCode: room.code, roomId: room.id };
  }

  if (room.status === "playing") {
    throw new AppError("CONFLICT", "بازی در حال اجراست؛ ورود به اتاق ممکن نیست.");
  }
  if (room.status === "finished") {
    throw new AppError(
      "CONFLICT",
      "این بازی پایان یافته است. از میزبان بخواهید بازی تازه شروع کند.",
    );
  }

  const count = await playerRepo.countPlayers(room.id);
  if (count >= room.maxPlayers) {
    throw new AppError("CONFLICT", "ظرفیت اتاق پر است.");
  }

  await playerRepo.createRoomPlayer({
    room: { connect: { id: room.id } },
    user: { connect: { id: params.userId } },
    displayName,
    isHost: false,
    isReady: false,
  });
  await userRepo.updateUserName(params.userId, displayName);

  emitRoomUpdate(room.code);
  return { roomCode: room.code, roomId: room.id };
}

export async function setReady(params: {
  userId: string;
  roomCode: string;
  isReady: boolean;
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما عضو این اتاق نیستید.");

  await playerRepo.updateRoomPlayer(rp.id, { isReady: params.isReady });
  emitRoomUpdate(params.roomCode);
}

export async function updateRoomSettings(params: {
  userId: string;
  roomCode: string;
  draftTotalRounds?: number;
  draftRoundTimeSec?: number;
  maxPlayers?: number;
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند تنظیمات را تغییر دهد.");
  }
  if (room.status !== "waiting") {
    throw new AppError("BAD_STATE", "تنظیمات فقط قبل از شروع بازی قابل تغییر است.");
  }

  const data: {
    draftTotalRounds?: number;
    draftRoundTimeSec?: number;
    maxPlayers?: number;
  } = {};
  if (params.draftTotalRounds !== undefined) {
    data.draftTotalRounds = Math.min(20, Math.max(1, params.draftTotalRounds));
  }
  if (params.draftRoundTimeSec !== undefined) {
    data.draftRoundTimeSec = Math.min(600, Math.max(30, params.draftRoundTimeSec));
  }
  if (params.maxPlayers !== undefined) {
    const count = await playerRepo.countPlayers(room.id);
    const nextMax = Math.min(16, Math.max(2, params.maxPlayers));
    if (nextMax < count) {
      throw new AppError("CONFLICT", "حداکثر بازیکن نمی‌تواند کمتر از تعداد فعلی باشد.");
    }
    data.maxPlayers = nextMax;
  }

  await roomRepo.updateRoom(room.id, data);
  emitRoomUpdate(params.roomCode);
}

export async function leaveRoom(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) return;

  const wasHost = rp.isHost;
  await playerRepo.deleteRoomPlayer(rp.id);

  const remaining = await roomRepo.findRoomByCode(room.code);
  if (!remaining || remaining.players.length === 0) {
    await roomRepo.deleteRoom(room.id);
    emitRoomUpdate(params.roomCode);
    return;
  }

  if (wasHost) {
    const nextHost = remaining.players.sort(
      (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime(),
    )[0];
    if (nextHost) {
      await playerRepo.updateRoomPlayer(nextHost.id, { isHost: true });
      await roomRepo.updateRoom(room.id, {
        host: { connect: { id: nextHost.userId } },
      });
    }
  }
  emitRoomUpdate(params.roomCode);
}

export async function replayRoom(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند بازی تازه کند.");
  }
  if (room.status !== "finished") {
    throw new AppError("BAD_STATE", "بازی تازه فقط پس از پایان بازی ممکن است.");
  }
  const active = await gameRepo.findLatestActiveGameForRoom(room.id);
  if (active) {
    throw new AppError("BAD_STATE", "ابتدا بازی جاری را تمام کنید.");
  }

  await roomRepo.updateRoom(room.id, { status: "waiting" });
  await playerRepo.resetReadyForRoom(room.id);
  emitRoomUpdate(params.roomCode);
}

export async function listRoomsForDirectory(): Promise<DirectoryRoom[]> {
  const rows = await roomRepo.listDirectoryRooms(50);
  return rows.map((r) => {
    const hostPlayer = r.players.find((p) => p.isHost);
    const hostLabel =
      hostPlayer?.displayName?.trim() ||
      r.host.name?.trim() ||
      "میزبان";
    const title =
      r.title.trim().length > 0 ? r.title.trim() : `اتاق ${r.code}`;
    return {
      roomCode: r.code,
      title,
      status: r.status as DirectoryRoom["status"],
      maxPlayers: r.maxPlayers,
      playerCount: r._count.players,
      draftRoundTimeSec: r.draftRoundTimeSec,
      draftTotalRounds: r.draftTotalRounds,
      hostLabel,
      players: r.players
        .slice(0, 4)
        .map((p) => ({ displayName: p.displayName })),
    };
  });
}

export async function listRoomChat(params: { userId: string; roomCode: string }) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما عضو این اتاق نیستید.");

  const rows = await chatRepo.listRoomChatMessages(room.id);
  return rows.map((m) => {
    const playerName = room.players.find((p) => p.userId === m.userId)
      ?.displayName;
    const displayName =
      playerName?.trim() ||
      m.user.name?.trim() ||
      "بازیکن";
    return {
      id: m.id,
      userId: m.userId,
      displayName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    };
  });
}

export async function postRoomChat(params: {
  userId: string;
  roomCode: string;
  body: string;
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما عضو این اتاق نیستید.");

  const body = params.body.trim();
  if (body.length === 0) {
    throw new AppError("VALIDATION", "پیام خالی است.");
  }
  if (body.length > MAX_CHAT_MESSAGE_LENGTH) {
    throw new AppError("VALIDATION", "پیام خیلی طولانی است.");
  }

  await chatRepo.createRoomChatMessage({
    roomId: room.id,
    userId: params.userId,
    body,
  });
  emitRoomUpdate(params.roomCode);
}

export async function getRoomState(roomCode: string) {
  const room = await roomRepo.findRoomByCodeWithGames(roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const activeGame = await gameRepo.findLatestActiveGameForRoom(room.id);
  const lastFinished = await gameRepo.findLatestFinishedGameForRoom(room.id);

  return {
    roomCode: room.code,
    title: room.title,
    isPrivate: room.isPrivate,
    status: room.status,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    draftTotalRounds: room.draftTotalRounds,
    draftRoundTimeSec: room.draftRoundTimeSec,
    activeGameId: activeGame?.id ?? null,
    lastFinishedGameId: lastFinished?.id ?? null,
    players: room.players.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      isHost: p.isHost,
      isReady: p.isReady,
      joinedAt: p.joinedAt.toISOString(),
    })),
    minPlayersToStart: MIN_PLAYERS_TO_START,
  };
}
