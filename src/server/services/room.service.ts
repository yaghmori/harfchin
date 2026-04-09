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
import * as friendshipRepo from "@/server/repositories/friendship.repository";
import * as roomInviteRepo from "@/server/repositories/room-invite.repository";
import { emitRoomUpdate } from "@/server/realtime/room-events";

function normalizeDisplayName(name: string): string {
  const t = name.trim();
  if (t.length === 0) throw new AppError("VALIDATION", "نام نمایشی الزامی است.");
  if (t.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new AppError("VALIDATION", "نام نمایشی خیلی طولانی است.");
  }
  return t;
}

function canPlayerInvite(room: { isPrivate: boolean; hostId: string }, userId: string) {
  if (!room.isPrivate) return true;
  return room.hostId === userId;
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
  const user = await userRepo.findUserById(params.userId);
  if (!user) {
    throw new AppError("FORBIDDEN", "کاربر معتبر نیست.");
  }
  const displaySource =
    params.displayName?.trim() || user.name?.trim() || "میزبان";
  const displayName = normalizeDisplayName(
    displaySource.slice(0, MAX_DISPLAY_NAME_LENGTH),
  );
  const maxPlayers = Math.min(
    16,
    Math.max(2, params.maxPlayers ?? 8),
  );
  const draftTotalRounds = Math.min(
    30,
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

  if (params.displayName?.trim()) {
    await userRepo.updateUserName(params.userId, displayName);
  }

  return { roomCode: room.code, roomId: room.id };
}

export async function joinRoom(params: {
  userId: string;
  roomCode: string;
  displayName?: string;
}) {
  const user = await userRepo.findUserById(params.userId);
  if (!user) {
    throw new AppError("FORBIDDEN", "کاربر معتبر نیست.");
  }
  const fromBody = params.displayName?.trim();
  const fromProfile = user.name?.trim();
  const displaySource = fromBody || fromProfile;
  if (!displaySource) {
    throw new AppError("VALIDATION", "نام نمایشی الزامی است.");
  }
  const displayName = normalizeDisplayName(
    displaySource.slice(0, MAX_DISPLAY_NAME_LENGTH),
  );
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
  await roomInviteRepo.markAcceptedForRoomAndInvitee({
    roomId: room.id,
    inviteeId: params.userId,
  });
  await userRepo.updateUserName(params.userId, displayName);

  emitRoomUpdate(room.code);
  return { roomCode: room.code, roomId: room.id };
}

export async function listIncomingRoomInvites(userId: string) {
  const rows = await roomInviteRepo.listPendingInvitesForUser(userId);
  return {
    items: rows.map((r) => ({
      inviteId: r.id,
      roomCode: r.room.code,
      roomTitle: r.room.title.trim() || `اتاق ${r.room.code}`,
      roomStatus: r.room.status,
      roomIsPrivate: r.room.isPrivate,
      inviterUserId: r.inviterId,
      inviterName: r.inviter.name?.trim() || "بازیکن",
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function respondRoomInvite(params: {
  userId: string;
  inviteId: string;
  action: "accept" | "decline";
  displayName?: string;
}) {
  const invite = await roomInviteRepo.findPendingInviteById(params.inviteId);
  if (!invite) throw new AppError("NOT_FOUND", "دعوت پیدا نشد.");
  if (invite.inviteeId !== params.userId) {
    throw new AppError("FORBIDDEN", "این دعوت برای شما نیست.");
  }

  if (params.action === "decline") {
    await roomInviteRepo.resolveInvite({ id: invite.id, status: "declined" });
    return { ok: true as const };
  }

  const displayName = normalizeDisplayName(
    (params.displayName ?? "بازیکن").slice(0, MAX_DISPLAY_NAME_LENGTH),
  );

  await joinRoom({
    userId: params.userId,
    roomCode: invite.room.code,
    displayName,
  });

  await roomInviteRepo.resolveInvite({ id: invite.id, status: "accepted" });
  return { ok: true as const, roomCode: invite.room.code };
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
    data.draftTotalRounds = Math.min(30, Math.max(1, params.draftTotalRounds));
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

/** Host removes another player from the lobby (waiting only). */
export async function removePlayerByHost(params: {
  hostUserId: string;
  roomCode: string;
  targetUserId: string;
}) {
  if (params.hostUserId === params.targetUserId) {
    throw new AppError(
      "VALIDATION",
      "خودتان را نمی‌توانید از اینجا حذف کنید؛ از خروج از اتاق استفاده کنید.",
    );
  }

  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.hostUserId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند بازیکن را حذف کند.");
  }
  if (room.status !== "waiting") {
    throw new AppError("BAD_STATE", "حذف بازیکن فقط قبل از شروع بازی ممکن است.");
  }

  const targetRp = await playerRepo.findRoomPlayer(room.id, params.targetUserId);
  if (!targetRp) {
    throw new AppError("NOT_FOUND", "این بازیکن در اتاق نیست.");
  }
  if (targetRp.isHost || targetRp.userId === room.hostId) {
    throw new AppError("FORBIDDEN", "نمی‌توان میزبان را از اتاق حذف کرد.");
  }

  await playerRepo.deleteRoomPlayer(targetRp.id);
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

export async function deleteRoomByHost(params: {
  userId: string;
  roomCode: string;
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  if (room.hostId !== params.userId) {
    throw new AppError("FORBIDDEN", "فقط میزبان می‌تواند اتاق را حذف کند.");
  }
  if (room.status === "playing") {
    throw new AppError("BAD_STATE", "در حین بازی حذف اتاق ممکن نیست.");
  }

  await roomRepo.deleteRoom(room.id);
  emitRoomUpdate(params.roomCode);
}

export async function listRoomsForDirectory(): Promise<DirectoryRoom[]> {
  const rows = await roomRepo.listDirectoryRooms(50);
  const joinable = rows.filter((r) => {
    if (r.status !== "waiting") return true;
    return r.players.some((p) => p.userId === r.hostId);
  });
  return joinable.map((r) => {
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

export async function getRoomState(roomCode: string, viewerUserId?: string) {
  const room = await roomRepo.findRoomByCodeWithGames(roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");

  const activeGame = await gameRepo.findLatestActiveGameForRoom(room.id);
  const lastFinished = await gameRepo.findLatestFinishedGameForRoom(room.id);

  const viewerPlayer = viewerUserId
    ? room.players.find((p) => p.userId === viewerUserId)
    : null;

  const hostPresentInLobby = room.players.some(
    (p) => p.userId === room.hostId,
  );

  return {
    roomCode: room.code,
    title: room.title,
    isPrivate: room.isPrivate,
    status: room.status,
    hostId: room.hostId,
    hostPresentInLobby,
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
    canInvite: viewerPlayer ? canPlayerInvite(room, viewerUserId!) : false,
    minPlayersToStart: MIN_PLAYERS_TO_START,
  };
}

export async function listInvitableFriends(params: {
  userId: string;
  roomCode: string;
}) {
  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  const rp = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!rp) throw new AppError("FORBIDDEN", "شما عضو این اتاق نیستید.");

  const canInvite = canPlayerInvite(room, params.userId);
  const inRoomUserIds = new Set(room.players.map((p) => p.userId));

  const friends = await friendshipRepo.listAcceptedFriends(params.userId);
  return {
    roomCode: room.code,
    roomIsPrivate: room.isPrivate,
    role: rp.isHost ? "host" : "player",
    canInvite,
    items: friends.map((f) => {
      const inRoom = inRoomUserIds.has(f.userId);
      return {
        userId: f.userId,
        displayName: f.name,
        inRoom,
        canInvite: canInvite && !inRoom && room.status === "waiting",
      };
    }),
  };
}

export async function inviteFriendToRoom(params: {
  userId: string;
  roomCode: string;
  friendUserId: string;
}) {
  if (params.friendUserId === params.userId) {
    throw new AppError("VALIDATION", "نمی‌توانید خودتان را دعوت کنید.");
  }

  const room = await roomRepo.findRoomByCode(params.roomCode);
  if (!room) throw new AppError("NOT_FOUND", "اتاق پیدا نشد.");
  const inviterPlayer = await playerRepo.findRoomPlayer(room.id, params.userId);
  if (!inviterPlayer) throw new AppError("FORBIDDEN", "شما عضو این اتاق نیستید.");
  if (!canPlayerInvite(room, params.userId)) {
    throw new AppError("FORBIDDEN", "در اتاق خصوصی فقط میزبان می‌تواند دعوت کند.");
  }
  if (room.status !== "waiting") {
    throw new AppError("BAD_STATE", "دعوت فقط در لابی قبل از شروع بازی ممکن است.");
  }

  const friend = await userRepo.findUserById(params.friendUserId);
  if (!friend || friend.isGuest) {
    throw new AppError("NOT_FOUND", "دوست موردنظر یافت نشد.");
  }

  const isFriend = await friendshipRepo.areFriends(params.userId, params.friendUserId);
  if (!isFriend) {
    throw new AppError("FORBIDDEN", "فقط دوستان شما قابل دعوت هستند.");
  }

  const alreadyInRoom = await playerRepo.findRoomPlayer(room.id, params.friendUserId);
  if (alreadyInRoom) {
    throw new AppError("CONFLICT", "این کاربر از قبل در اتاق حضور دارد.");
  }

  const currentCount = await playerRepo.countPlayers(room.id);
  if (currentCount >= room.maxPlayers) {
    throw new AppError("CONFLICT", "ظرفیت اتاق پر است.");
  }

  const existingInvite = await roomInviteRepo.findPendingInvite({
    roomId: room.id,
    inviteeId: params.friendUserId,
  });
  if (!existingInvite) {
    await roomInviteRepo.createRoomInvite({
      roomId: room.id,
      inviterId: params.userId,
      inviteeId: params.friendUserId,
    });
  }

  return { ok: true as const };
}
