import { prisma } from "@/lib/prisma";

export async function createRoomInvite(params: {
  roomId: string;
  inviterId: string;
  inviteeId: string;
}) {
  const pendingKey = `${params.roomId}:${params.inviteeId}`;
  return prisma.roomInvite.create({
    data: {
      roomId: params.roomId,
      inviterId: params.inviterId,
      inviteeId: params.inviteeId,
      status: "pending",
      pendingKey,
    },
  });
}

export async function findPendingInvite(params: {
  roomId: string;
  inviteeId: string;
}) {
  return prisma.roomInvite.findFirst({
    where: {
      roomId: params.roomId,
      inviteeId: params.inviteeId,
      status: "pending",
    },
    select: { id: true, createdAt: true },
  });
}

export async function listPendingInvitesForUser(userId: string) {
  return prisma.roomInvite.findMany({
    where: {
      inviteeId: userId,
      status: "pending",
    },
    include: {
      room: { select: { id: true, code: true, title: true, isPrivate: true, status: true } },
      inviter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPendingInviteById(id: string) {
  return prisma.roomInvite.findFirst({
    where: { id, status: "pending" },
    include: {
      room: true,
    },
  });
}

export async function resolveInvite(params: {
  id: string;
  status: "accepted" | "declined" | "cancelled" | "expired";
}) {
  return prisma.roomInvite.update({
    where: { id: params.id },
    data: {
      status: params.status,
      respondedAt: new Date(),
      pendingKey: null,
    },
  });
}

export async function markAcceptedForRoomAndInvitee(params: {
  roomId: string;
  inviteeId: string;
}) {
  return prisma.roomInvite.updateMany({
    where: {
      roomId: params.roomId,
      inviteeId: params.inviteeId,
      status: "pending",
    },
    data: {
      status: "accepted",
      respondedAt: new Date(),
      pendingKey: null,
    },
  });
}
