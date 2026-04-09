"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/features/api/client";
import { API_ENDPOINTS } from "@/features/api/endpoints";
import type { ChatMessage, RoomState } from "@/components/lobby/types";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { QueryKeys } from "@/lib/query-keys";
import type { DirectoryRoom } from "@/lib/room-directory";

export type FriendsForRoomPayload = {
  canInvite: boolean;
  roomIsPrivate: boolean;
  role: "host" | "player";
  items: {
    userId: string;
    displayName: string;
    inRoom: boolean;
    canInvite: boolean;
  }[];
};

export type FriendNetwork = {
  friends: { userId: string; name: string }[];
  incomingRequests: {
    friendshipId: string;
    userId: string;
    displayName: string;
    createdAt: string;
  }[];
  outgoingRequests: {
    friendshipId: string;
    userId: string;
    displayName: string;
    createdAt: string;
  }[];
};

export type DiscoverResult = {
  items: {
    userId: string;
    displayName: string;
    handle: string | null;
    relationStatus: "friend" | "incoming" | "outgoing" | "none";
  }[];
};

export type InviteInbox = {
  items: {
    inviteId: string;
    roomCode: string;
    roomTitle: string;
    inviterName: string;
    roomStatus: "waiting" | "playing" | "finished";
  }[];
};

export type AuthMeUser = {
  id: string;
  email: string | null;
  name: string | null;
  isGuest: boolean;
  isRegistered: boolean;
  createdAt: string;
} | null;

export type AuthMePayload = { user: AuthMeUser };

export type GamePayload = {
  meUserId: string;
  meRoomPlayerId: string | null;
  hostUserId: string;
  phase: "none" | "playing" | "processing_round" | "round_results" | "finished";
  roomStatus: string;
  game: {
    id: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    roundTimeSec: number;
  } | null;
  round: {
    id: string;
    roundNumber: number;
    letter: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    endsAt: string;
  } | null;
  players: {
    id: string;
    displayName: string;
    isHost: boolean;
    answers: {
      categoryKey: string;
      value: string;
      normalizedValue: string;
      isValid: boolean;
      score: number;
    }[];
  }[];
  leaderboard: {
    roomPlayerId: string;
    displayName: string;
    totalScore: number;
  }[];
  categories: { key: string; title: string }[];
};

export type ResultsPayload = {
  meUserId: string;
  meRoomPlayerId: string | null;
  hostUserId: string;
  roomCode: string;
  game: {
    id: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    roundTimeSec: number;
  };
  round: {
    id: string;
    roundNumber: number;
    letter: string;
    status: string;
  } | null;
  leaderboard: { roomPlayerId: string; displayName: string; totalScore: number }[];
  categories: { key: string; title: string }[];
  players: {
    id: string;
    displayName: string;
    isHost: boolean;
    answers: {
      categoryKey: string;
      value: string;
      normalizedValue: string;
      isValid: boolean;
      score: number;
    }[];
  }[];
  roundsSummary?: {
    roundNumber: number;
    letter: string;
    players: {
      id: string;
      displayName: string;
      isHost: boolean;
      answers: {
        categoryKey: string;
        value: string;
        normalizedValue: string;
        isValid: boolean;
        score: number;
      }[];
    }[];
  }[];
};

export type RoomsListPayload = { rooms: DirectoryRoom[] };

export function useRoomStateQuery(roomCode: string) {
  return useQuery({
    queryKey: QueryKeys.roomState(roomCode),
    queryFn: () => apiGet<RoomState>(API_ENDPOINTS.room.state(roomCode)),
  });
}

export function useRoomChatQuery(roomCode: string) {
  return useQuery({
    queryKey: QueryKeys.roomChat(roomCode),
    queryFn: () =>
      apiGet<{ messages: ChatMessage[] }>(
        `${API_ENDPOINTS.room.chat}?code=${encodeURIComponent(roomCode)}`,
      ),
    retry: false,
  });
}

export function useFriendsForRoomQuery(roomCode: string) {
  return useQuery({
    queryKey: QueryKeys.friendsForRoom(roomCode),
    queryFn: () =>
      apiGet<FriendsForRoomPayload>(
        API_ENDPOINTS.friends.listByRoomCode(roomCode),
      ),
    retry: false,
  });
}

export function useGameStateByRoomQuery(roomCode: string) {
  return useQuery({
    queryKey: QueryKeys.roundState(roomCode),
    queryFn: () =>
      apiGet<GamePayload>(API_ENDPOINTS.game.stateByRoomCode(roomCode)),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useResultsByGameIdQuery(gameId: string) {
  return useQuery({
    queryKey: QueryKeys.results(gameId),
    queryFn: () =>
      apiGet<ResultsPayload>(API_ENDPOINTS.game.stateByGameId(gameId)),
    enabled: gameId.length > 0,
  });
}

export function useRoomsListQuery() {
  return useQuery({
    queryKey: QueryKeys.roomsList(),
    queryFn: () => apiGet<RoomsListPayload>(API_ENDPOINTS.room.list),
    refetchInterval: 8_000,
  });
}

export function useFriendsNetworkQuery() {
  return useQuery({
    queryKey: QueryKeys.friendsNetwork(),
    queryFn: () => apiGet<FriendNetwork>(API_ENDPOINTS.friends.network),
  });
}

export function useFriendsDiscoverQuery(q: string) {
  return useQuery({
    queryKey: QueryKeys.friendsDiscover(q),
    queryFn: () => apiGet<DiscoverResult>(API_ENDPOINTS.friends.discover(q)),
  });
}

export function useRoomInviteInboxQuery() {
  return useQuery({
    queryKey: QueryKeys.roomInviteInbox(),
    queryFn: () => apiGet<InviteInbox>(API_ENDPOINTS.room.inviteList),
  });
}
