import { prisma } from "@/lib/prisma";
import type { FriendshipStatus } from "@/generated/prisma";

export function makeFriendPairKey(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join(":");
}

export async function listAcceptedFriends(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, isGuest: true } },
      addressee: { select: { id: true, name: true, isGuest: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((f) => {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    return {
      userId: friend.id,
      name: friend.name?.trim() || "بازیکن",
      isGuest: friend.isGuest,
      friendshipId: f.id,
    };
  });
}

export async function areFriends(userAId: string, userBId: string) {
  const pairKey = makeFriendPairKey(userAId, userBId);
  const row = await prisma.friendship.findFirst({
    where: {
      pairKey,
      status: "accepted",
    },
    select: { id: true },
  });
  return !!row;
}

export async function findFriendshipByPair(userAId: string, userBId: string) {
  return prisma.friendship.findUnique({
    where: { pairKey: makeFriendPairKey(userAId, userBId) },
  });
}

export async function createFriendRequest(params: {
  requesterId: string;
  addresseeId: string;
}) {
  return prisma.friendship.create({
    data: {
      requesterId: params.requesterId,
      addresseeId: params.addresseeId,
      pairKey: makeFriendPairKey(params.requesterId, params.addresseeId),
      status: "pending",
    },
  });
}

export async function upsertFriendshipByPair(params: {
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  acceptedAt?: Date | null;
  blockedAt?: Date | null;
}) {
  const pairKey = makeFriendPairKey(params.requesterId, params.addresseeId);
  return prisma.friendship.upsert({
    where: { pairKey },
    create: {
      requesterId: params.requesterId,
      addresseeId: params.addresseeId,
      pairKey,
      status: params.status,
      acceptedAt: params.acceptedAt ?? null,
      blockedAt: params.blockedAt ?? null,
    },
    update: {
      requesterId: params.requesterId,
      addresseeId: params.addresseeId,
      status: params.status,
      acceptedAt: params.acceptedAt ?? null,
      blockedAt: params.blockedAt ?? null,
    },
  });
}

export async function findIncomingPending(userId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: userId, status: "pending" },
    include: {
      requester: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findOutgoingPending(userId: string) {
  return prisma.friendship.findMany({
    where: { requesterId: userId, status: "pending" },
    include: {
      addressee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPendingById(id: string) {
  return prisma.friendship.findFirst({
    where: { id, status: "pending" },
  });
}

export async function updateFriendship(
  id: string,
  data: {
    status?: FriendshipStatus;
    acceptedAt?: Date | null;
    blockedAt?: Date | null;
  },
) {
  return prisma.friendship.update({
    where: { id },
    data,
  });
}

export async function deleteFriendshipByPair(userAId: string, userBId: string) {
  const row = await findFriendshipByPair(userAId, userBId);
  if (!row) return null;
  return prisma.friendship.delete({ where: { id: row.id } });
}
