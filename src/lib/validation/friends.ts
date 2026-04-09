import { z } from "zod";

export const friendUserIdBodySchema = z.object({
  targetUserId: z.string().uuid(),
});

export const friendRespondBodySchema = z.object({
  friendshipId: z.string().uuid(),
  action: z.enum(["accept", "decline", "block"]),
});
