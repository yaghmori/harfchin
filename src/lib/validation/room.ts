import { z } from "zod";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_ROOM_TITLE_LENGTH,
} from "@/lib/constants";

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
  displayName: z.string().min(1).max(MAX_DISPLAY_NAME_LENGTH),
});

export const readyBodySchema = z.object({
  roomCode: roomCodeSchema,
  isReady: z.boolean(),
});

export const roomCodeBodySchema = z.object({
  roomCode: roomCodeSchema,
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
