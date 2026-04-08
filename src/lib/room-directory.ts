export type DirectoryRoom = {
  roomCode: string;
  title: string;
  status: "waiting" | "playing";
  maxPlayers: number;
  playerCount: number;
  draftRoundTimeSec: number;
  draftTotalRounds: number;
  hostLabel: string;
  players: { displayName: string }[];
};
