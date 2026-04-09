export const API_BASE_ENDPOINT = "/api" as const;

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_ENDPOINT}/auth/login`,
    signup: `${API_BASE_ENDPOINT}/auth/signup`,
    logout: `${API_BASE_ENDPOINT}/auth/logout`,
    me: `${API_BASE_ENDPOINT}/auth/me`,
  },
  user: {
    profile: `${API_BASE_ENDPOINT}/user/profile`,
    password: `${API_BASE_ENDPOINT}/user/password`,
    account: `${API_BASE_ENDPOINT}/user/account`,
  },
  friends: {
    listByRoomCode: (roomCode: string) =>
      `${API_BASE_ENDPOINT}/friends/list?roomCode=${encodeURIComponent(roomCode)}`,
    discover: (q: string) =>
      `${API_BASE_ENDPOINT}/friends/discover?q=${encodeURIComponent(q)}`,
    network: `${API_BASE_ENDPOINT}/friends/network`,
    request: `${API_BASE_ENDPOINT}/friends/request`,
    respond: `${API_BASE_ENDPOINT}/friends/respond`,
    block: `${API_BASE_ENDPOINT}/friends/block`,
    unfriend: `${API_BASE_ENDPOINT}/friends/unfriend`,
  },
  room: {
    create: `${API_BASE_ENDPOINT}/room/create`,
    list: `${API_BASE_ENDPOINT}/room/list`,
    join: `${API_BASE_ENDPOINT}/room/join`,
    ready: `${API_BASE_ENDPOINT}/room/ready`,
    replay: `${API_BASE_ENDPOINT}/room/replay`,
    delete: `${API_BASE_ENDPOINT}/room/delete`,
    leave: `${API_BASE_ENDPOINT}/room/leave`,
    kick: `${API_BASE_ENDPOINT}/room/kick`,
    chat: `${API_BASE_ENDPOINT}/room/chat`,
    invite: `${API_BASE_ENDPOINT}/room/invite`,
    inviteList: `${API_BASE_ENDPOINT}/room/invite/list`,
    inviteRespond: `${API_BASE_ENDPOINT}/room/invite/respond`,
    state: (code: string) =>
      `${API_BASE_ENDPOINT}/room/state?code=${encodeURIComponent(code)}`,
  },
  game: {
    start: `${API_BASE_ENDPOINT}/game/start`,
    completeRound: `${API_BASE_ENDPOINT}/game/complete-round`,
    nextRound: `${API_BASE_ENDPOINT}/game/next-round`,
    endGame: `${API_BASE_ENDPOINT}/game/end-game`,
    stateByRoomCode: (roomCode: string) =>
      `${API_BASE_ENDPOINT}/game/state?roomCode=${encodeURIComponent(roomCode)}`,
    stateByGameId: (gameId: string) =>
      `${API_BASE_ENDPOINT}/game/state?gameId=${encodeURIComponent(gameId)}`,
  },
  realtime: {
    room: (roomCode: string) =>
      `${API_BASE_ENDPOINT}/realtime/room?code=${encodeURIComponent(roomCode)}`,
  },
} as const;
