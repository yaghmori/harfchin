/**
 * Central query key factory for TanStack Query.
 * Use these keys for queries, invalidation, and prefetching so keys stay consistent.
 */
export class QueryKeys {
  static roomState(roomCode: string) {
    return ["room-state", roomCode] as const;
  }

  static roomChat(roomCode: string) {
    return ["room-chat", roomCode] as const;
  }

  static friendsForRoom(roomCode: string) {
    return ["friends-for-room", roomCode] as const;
  }

  static roundState(roomCode: string) {
    return ["round-state", roomCode] as const;
  }

  static results(gameId: string) {
    return ["results", gameId] as const;
  }

  static roomsList() {
    return ["rooms-list"] as const;
  }

  static friendsNetwork() {
    return ["friends-network"] as const;
  }

  static friendsDiscover(q: string) {
    return ["friends-discover", q] as const;
  }

  /** Invalidates every friends-discover query regardless of search string. */
  static friendsDiscoverAll() {
    return ["friends-discover"] as const;
  }

  static roomInviteInbox() {
    return ["room-invite-inbox"] as const;
  }
}
