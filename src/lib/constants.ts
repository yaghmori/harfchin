/** Curated Persian letters for MVP rounds (easy set). */
export const ALLOWED_PERSIAN_LETTERS = [
  "ا",
  "ب",
  "پ",
  "ت",
  "س",
  "ش",
  "ف",
  "ک",
  "گ",
  "م",
  "ن",
] as const;

export type AllowedPersianLetter = (typeof ALLOWED_PERSIAN_LETTERS)[number];

export const MIN_PLAYERS_TO_START = 2;

export const COOKIE_USER_ID = "hc_user_id";

export const MAX_DISPLAY_NAME_LENGTH = 32;

export const MAX_ROOM_TITLE_LENGTH = 64;

export const MAX_ANSWER_LENGTH = 120;

/** Max length for a single lobby / room chat message (UTF-8 text). */
export const MAX_CHAT_MESSAGE_LENGTH = 500;

/** Polling interval for game state when not using SSE. */
export const POLL_INTERVAL_MS = 2500;
