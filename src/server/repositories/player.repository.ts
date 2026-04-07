import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findRoomPlayer(roomId: string, userId: string) {
  return prisma.roomPlayer.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
}

export async function createRoomPlayer(data: Prisma.RoomPlayerCreateInput) {
  return prisma.roomPlayer.create({ data });
}

export async function updateRoomPlayer(
  id: string,
  data: Prisma.RoomPlayerUpdateInput,
) {
  return prisma.roomPlayer.update({ where: { id }, data });
}

export async function deleteRoomPlayer(id: string) {
  return prisma.roomPlayer.delete({ where: { id } });
}

export async function countPlayers(roomId: string) {
  return prisma.roomPlayer.count({ where: { roomId } });
}

export async function resetReadyForRoom(roomId: string) {
  return prisma.roomPlayer.updateMany({
    where: { roomId },
    data: { isReady: false },
  });
}
