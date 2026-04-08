import { prisma } from "@/lib/prisma";

const DEFAULT_TAKE = 80;

export async function createRoomChatMessage(params: {
  roomId: string;
  userId: string;
  body: string;
}) {
  return prisma.roomChatMessage.create({
    data: {
      roomId: params.roomId,
      userId: params.userId,
      body: params.body,
    },
  });
}

export async function listRoomChatMessages(roomId: string, take = DEFAULT_TAKE) {
  return prisma.roomChatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take,
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}
