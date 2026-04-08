import { z } from "zod";
import { roomCodeSchema } from "@/lib/validation/room";

export const submitAnswersSchema = z.object({
  roomCode: roomCodeSchema,
  answers: z.array(
    z.object({
      categoryKey: z.string().min(1),
      value: z.string(),
    }),
  ),
});

export const completeRoundSchema = z.object({
  roomCode: roomCodeSchema,
  answers: z
    .array(
      z.object({
        categoryKey: z.string().min(1),
        value: z.string(),
      }),
    )
    .default([]),
});

export const gameStateQuerySchema = z
  .object({
    roomCode: roomCodeSchema.optional(),
    gameId: z.string().min(1).optional(),
  })
  .refine((q) => q.roomCode || q.gameId, {
    message: "roomCode یا gameId لازم است.",
  });
