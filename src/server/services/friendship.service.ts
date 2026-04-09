import { AppError } from "@/lib/errors";
import * as friendshipRepo from "@/server/repositories/friendship.repository";
import * as userRepo from "@/server/repositories/user.repository";

export async function sendFriendRequest(params: {
  userId: string;
  targetUserId: string;
}) {
  if (params.userId === params.targetUserId) {
    throw new AppError("VALIDATION", "نمی‌توانید خودتان را دوست کنید.");
  }

  const target = await userRepo.findUserById(params.targetUserId);
  if (!target || target.isGuest) {
    throw new AppError("NOT_FOUND", "کاربر موردنظر یافت نشد.");
  }

  const existing = await friendshipRepo.findFriendshipByPair(
    params.userId,
    params.targetUserId,
  );

  if (!existing) {
    await friendshipRepo.createFriendRequest({
      requesterId: params.userId,
      addresseeId: params.targetUserId,
    });
    return { ok: true as const };
  }

  if (existing.status === "accepted") {
    return { ok: true as const };
  }
  if (existing.status === "blocked") {
    throw new AppError("FORBIDDEN", "این ارتباط مسدود شده است.");
  }

  if (existing.requesterId === params.userId) {
    return { ok: true as const };
  }

  await friendshipRepo.updateFriendship(existing.id, {
    status: "accepted",
    acceptedAt: new Date(),
    blockedAt: null,
  });
  return { ok: true as const };
}

export async function respondFriendRequest(params: {
  userId: string;
  friendshipId: string;
  action: "accept" | "decline" | "block";
}) {
  const row = await friendshipRepo.findPendingById(params.friendshipId);
  if (!row) throw new AppError("NOT_FOUND", "درخواست دوستی پیدا نشد.");
  if (row.addresseeId !== params.userId) {
    throw new AppError("FORBIDDEN", "این درخواست برای شما نیست.");
  }

  if (params.action === "accept") {
    await friendshipRepo.updateFriendship(row.id, {
      status: "accepted",
      acceptedAt: new Date(),
      blockedAt: null,
    });
    return { ok: true as const };
  }
  if (params.action === "block") {
    await friendshipRepo.updateFriendship(row.id, {
      status: "blocked",
      blockedAt: new Date(),
      acceptedAt: null,
    });
    return { ok: true as const };
  }

  await friendshipRepo.deleteFriendshipByPair(row.requesterId, row.addresseeId);
  return { ok: true as const };
}

export async function blockUser(params: { userId: string; targetUserId: string }) {
  if (params.userId === params.targetUserId) {
    throw new AppError("VALIDATION", "نمی‌توانید خودتان را مسدود کنید.");
  }
  const target = await userRepo.findUserById(params.targetUserId);
  if (!target || target.isGuest) {
    throw new AppError("NOT_FOUND", "کاربر موردنظر یافت نشد.");
  }

  await friendshipRepo.upsertFriendshipByPair({
    requesterId: params.userId,
    addresseeId: params.targetUserId,
    status: "blocked",
    blockedAt: new Date(),
    acceptedAt: null,
  });
  return { ok: true as const };
}

export async function unfriend(params: { userId: string; targetUserId: string }) {
  await friendshipRepo.deleteFriendshipByPair(params.userId, params.targetUserId);
  return { ok: true as const };
}

export async function listFriendNetwork(userId: string) {
  const [friends, incoming, outgoing] = await Promise.all([
    friendshipRepo.listAcceptedFriends(userId),
    friendshipRepo.findIncomingPending(userId),
    friendshipRepo.findOutgoingPending(userId),
  ]);

  return {
    friends,
    incomingRequests: incoming.map((r) => ({
      friendshipId: r.id,
      userId: r.requesterId,
      displayName: r.requester.name?.trim() || "بازیکن",
      createdAt: r.createdAt.toISOString(),
    })),
    outgoingRequests: outgoing.map((r) => ({
      friendshipId: r.id,
      userId: r.addresseeId,
      displayName: r.addressee.name?.trim() || "بازیکن",
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function discoverUsers(params: { userId: string; q?: string }) {
  const [friends, incoming, outgoing] = await Promise.all([
    friendshipRepo.listAcceptedFriends(params.userId),
    friendshipRepo.findIncomingPending(params.userId),
    friendshipRepo.findOutgoingPending(params.userId),
  ]);

  const friendIds = new Set(friends.map((f) => f.userId));
  const incomingIds = new Set(incoming.map((r) => r.requesterId));
  const outgoingIds = new Set(outgoing.map((r) => r.addresseeId));

  const rows = await userRepo.searchRegisteredUsers({
    query: params.q,
    excludeUserIds: [params.userId],
    take: 20,
  });

  return {
    items: rows.map((u) => {
      const status = friendIds.has(u.id)
        ? "friend"
        : incomingIds.has(u.id)
          ? "incoming"
          : outgoingIds.has(u.id)
            ? "outgoing"
            : "none";
      return {
        userId: u.id,
        displayName: u.name?.trim() || "بازیکن",
        handle: u.email ?? null,
        relationStatus: status as "friend" | "incoming" | "outgoing" | "none",
      };
    }),
  };
}
