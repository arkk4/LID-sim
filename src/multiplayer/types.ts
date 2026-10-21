import { Question } from '../types';

// Modes -----------------------------------------------------------------

/** "Sofort" = reveal answer after every question; "Abschluss" = reveal at end */
export type RoomMode = 'sofort' | 'abschluss';

// Player ----------------------------------------------------------------

export interface Player {
  id: string;       // PeerJS connection ID (host uses 'host')
  name: string;
  score: number;
  answers: Record<number, 'a' | 'b' | 'c' | 'd' | null>; // keyed by question index
}

// Room state (maintained by host, synced to clients) --------------------

export type RoomPhase =
  | 'lobby'      // waiting for players
  | 'question'   // question visible, timer running
  | 'reveal'     // answer revealed (sofort mode only, brief pause)
  | 'finished';  // game over, leaderboard

export interface RoomState {
  roomCode: string;
  mode: RoomMode;
  secondsPerQuestion: number;
  phase: RoomPhase;
  questionIndex: number;      // 0-based
  totalQuestions: number;     // 33
  answeredCount: number;      // how many players answered this question
  playerCount: number;        // total connected players (including host)
  scores: { id: string; name: string; score: number }[]; // sorted for leaderboard
}

// Messages (PeerJS DataChannel) -----------------------------------------

export type HostMsg =
  | { type: 'STATE'; state: RoomState }
  | { type: 'QUESTION'; q: Question; index: number; timeLimit: number }
  | { type: 'ANSWER_COUNT'; count: number; total: number }
  | { type: 'REVEAL'; correctLetter: 'a' | 'b' | 'c' | 'd'; scores: RoomState['scores'] }
  | { type: 'FINISH'; scores: RoomState['scores'] }
  | { type: 'KICK' }
  | { type: 'PING' }
  | { type: 'REJECTED'; reason: 'game_in_progress' };

export type ClientMsg =
  | { type: 'JOIN'; name: string }
  | { type: 'ANSWER'; letter: 'a' | 'b' | 'c' | 'd'; questionIndex: number }
  | { type: 'PONG' };
