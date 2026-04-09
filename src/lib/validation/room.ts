import { z } from "zod";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_ROOM_TITLE_LENGTH,
} from "@/lib/constants";

const uuidSchema = z.string().uuid();
export const roomCodeSchema = z
  .string()
  .min(4)
  .max(8)
  .transform((s) => s.trim().toUpperCase());

export const createRoomBodySchema = z.object({
  /** Room label (lobby / invite). Host display name defaults from this if omitted. */
  title: z.string().min(1).max(MAX_ROOM_TITLE_LENGTH),
  displayName: z.string().min(1).max(MAX_DISPLAY_NAME_LENGTH).optional(),
  isPrivate: z.boolean().optional(),
  maxPlayers: z.number().int().min(2).max(16).optional(),
  draftTotalRounds: z.number().int().min(1).max(30).optional(),
  draftRoundTimeSec: z.number().int().min(30).max(600).optional(),
});

export const joinRoomBodySchema = z.object({
  roomCode: roomCodeSchema,
  /** Omit to use the signed-in user's profile name (must be non-empty). */
  displayName: z
    .string()
    .max(MAX_DISPLAY_NAME_LENGTH)
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t && t.length > 0 ? t : undefined;
    }),
});

export const readyBodySchema = z.object({
  roomCode: roomCodeSchema,
  isReady: z.boolean(),
});

export const roomCodeBodySchema = z.object({
  roomCode: roomCodeSchema,
});

export const inviteFriendBodySchema = z.object({
  roomCode: roomCodeSchema,
  friendUserId: uuidSchema,
});

export const kickPlayerBodySchema = z.object({
  roomCode: roomCodeSchema,
  targetUserId: uuidSchema,
});

export const respondRoomInviteBodySchema = z.object({
  inviteId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
  displayName: z.string().min(1).max(MAX_DISPLAY_NAME_LENGTH).optional(),
});

export const settingsBodySchema = z.object({
  roomCode: roomCodeSchema,
  draftTotalRounds: z.number().int().min(1).max(30).optional(),
  draftRoundTimeSec: z.number().int().min(30).max(600).optional(),
  maxPlayers: z.number().int().min(2).max(16).optional(),
});

export const roomChatPostBodySchema = z.object({
  roomCode: roomCodeSchema,
  body: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
});
