export type Player = {
  id: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
};

export type RoomState = {
  roomCode: string;
  title: string;
  isPrivate: boolean;
  status: string;
  hostId: string;
  maxPlayers: number;
  draftTotalRounds: number;
  draftRoundTimeSec: number;
  activeGameId: string | null;
  lastFinishedGameId: string | null;
  players: Player[];
  minPlayersToStart: number;
  meUserId: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
};
