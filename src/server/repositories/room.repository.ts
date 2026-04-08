import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function findRoomByCode(code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      players: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      host: true,
    },
  });
}

export async function findRoomByCodeWithGames(code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      players: { orderBy: { joinedAt: "asc" } },
      games: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function createRoom(data: Prisma.RoomCreateInput) {
  return prisma.room.create({ data });
}

export async function updateRoom(
  roomId: string,
  data: Prisma.RoomUpdateInput,
) {
  return prisma.room.update({ where: { id: roomId }, data });
}

export async function deleteRoom(roomId: string) {
  return prisma.room.delete({ where: { id: roomId } });
}

/** Active public rooms for the directory (joinable discovery). */
export async function listDirectoryRooms(limit: number) {
  return prisma.room.findMany({
    where: {
      status: { in: ["waiting", "playing"] },
      isPrivate: false,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      players: { orderBy: { joinedAt: "asc" } },
      host: { select: { id: true, name: true } },
      _count: { select: { players: true } },
    },
  });
}
