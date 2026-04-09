"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPatch, apiPost } from "@/features/api/client";
import { API_ENDPOINTS } from "@/features/api/endpoints";
import { QueryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: { identifier: string; password: string }) =>
      apiPost(API_ENDPOINTS.auth.login, payload),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      name: string;
    }) => apiPost(API_ENDPOINTS.auth.signup, payload),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>(API_ENDPOINTS.auth.logout, {}),
  });
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      apiPatch(API_ENDPOINTS.user.profile, payload),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: {
      newPassword: string;
      confirmNewPassword: string;
    }) => apiPatch<{ success: true }>(API_ENDPOINTS.user.password, payload),
  });
}

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: () => apiDelete<{ success: true }>(API_ENDPOINTS.user.account),
  });
}

export function useCreateRoomMutation() {
  return useMutation({
    mutationFn: (payload: {
      title: string;
      isPrivate: boolean;
      draftTotalRounds: number;
      draftRoundTimeSec: number;
      maxPlayers: number;
    }) => apiPost<{ roomCode: string }>(API_ENDPOINTS.room.create, payload),
  });
}

export function useJoinRoomMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string; displayName?: string }) =>
      apiPost<{ roomCode: string }>(API_ENDPOINTS.room.join, payload),
  });
}

export function useRoomReadyMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string; isReady: boolean }) =>
      apiPost(API_ENDPOINTS.room.ready, payload),
  });
}

export function useGameStartMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost(API_ENDPOINTS.game.start, payload),
  });
}

export function useRoomReplayMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost(API_ENDPOINTS.room.replay, payload),
  });
}

export function useRoomDeleteMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost(API_ENDPOINTS.room.delete, payload),
  });
}

export function useRoomLeaveMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost<{ ok: boolean }>(API_ENDPOINTS.room.leave, payload),
  });
}

export function useRoomKickMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string; targetUserId: string }) =>
      apiPost<{ ok: boolean }>(API_ENDPOINTS.room.kick, payload),
  });
}

export function useRoomChatPostMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string; body: string }) =>
      apiPost(API_ENDPOINTS.room.chat, payload),
  });
}

export function useRoomInviteMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string; friendUserId: string }) =>
      apiPost(API_ENDPOINTS.room.invite, payload),
  });
}

export type CompleteRoundResponse =
  | { outcome: "game_finished"; gameId: string }
  | { outcome: "round_scored"; gameId: string }
  | {
      outcome: "waiting_for_players";
      readyCount: number;
      totalPlayers: number;
    };

export function useCompleteRoundMutation() {
  return useMutation({
    mutationFn: (payload: {
      roomCode: string;
      answers: { categoryKey: string; value: string }[];
    }) =>
      apiPost<CompleteRoundResponse>(
        API_ENDPOINTS.game.completeRound,
        payload,
      ),
  });
}

export function useNextRoundMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost<{ finished: boolean; gameId: string }>(
        API_ENDPOINTS.game.nextRound,
        payload,
      ),
  });
}

export function useEndGameMutation() {
  return useMutation({
    mutationFn: (payload: { roomCode: string }) =>
      apiPost<{ gameId: string }>(API_ENDPOINTS.game.endGame, payload),
  });
}

export function useFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      apiPost(API_ENDPOINTS.friends.request, { targetUserId }),
    onSuccess: async () => {
      toast.success("درخواست دوستی ارسال شد.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryKeys.friendsNetwork() }),
        queryClient.invalidateQueries({
          queryKey: QueryKeys.friendsDiscoverAll(),
        }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "خطا"),
  });
}

export function useFriendRespondMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      friendshipId: string;
      action: "accept" | "decline" | "block";
    }) => apiPost(API_ENDPOINTS.friends.respond, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryKeys.friendsNetwork() }),
        queryClient.invalidateQueries({
          queryKey: QueryKeys.friendsDiscoverAll(),
        }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "خطا"),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      apiPost(API_ENDPOINTS.friends.unfriend, { targetUserId }),
    onSuccess: async () => {
      toast.success("از لیست دوستان حذف شد.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryKeys.friendsNetwork() }),
        queryClient.invalidateQueries({
          queryKey: QueryKeys.friendsDiscoverAll(),
        }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "خطا"),
  });
}

export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) =>
      apiPost(API_ENDPOINTS.friends.block, { targetUserId }),
    onSuccess: async () => {
      toast.success("کاربر مسدود شد.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryKeys.friendsNetwork() }),
        queryClient.invalidateQueries({
          queryKey: QueryKeys.friendsDiscoverAll(),
        }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "خطا"),
  });
}

export function useRoomInviteRespondMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { inviteId: string; action: "accept" | "decline" }) =>
      apiPost(API_ENDPOINTS.room.inviteRespond, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QueryKeys.roomInviteInbox(),
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "خطا"),
  });
}
