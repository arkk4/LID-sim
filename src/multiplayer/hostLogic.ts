/**
 * Pure host state machine — no React, no PeerJS.
 * The hook delegates to this class; tests hit it directly.
 */

import { Question } from '../types';
import { Player, RoomMode, RoomPhase } from './types';

export interface HostLogicCallbacks {
  onStateChange: () => void;
  onBroadcast: (msg: object) => void;
  onTimer: (ms: number, fn: () => void) => number;
  onClearTimer: (id: number) => void;
}

export class HostLogic {
  // ── public readable state ──────────────────────────────────────────────
  phase: RoomPhase = 'lobby';
  questionIndex = 0;
  answeredCount = 0;
  revealLetter: 'a' | 'b' | 'c' | 'd' | null = null;

  // ── private ────────────────────────────────────────────────────────────
  private players: Map<string, Player> = new Map();
  private questions: Question[];
  private mode: RoomMode;
  private secondsPerQuestion: number;
  private timer: number | null = null;
  private cb: HostLogicCallbacks;

  constructor(
    questions: Question[],
    mode: RoomMode,
    secondsPerQuestion: number,
    hostName: string,
    cb: HostLogicCallbacks,
  ) {
    this.questions = questions;
    this.mode = mode;
    this.secondsPerQuestion = secondsPerQuestion;
    this.cb = cb;
    this.players.set('host', { id: 'host', name: hostName || 'Host', score: 0, answers: {} });
  }

  // ── player management ──────────────────────────────────────────────────

  addPlayer(id: string, name: string): boolean {
    if (this.phase !== 'lobby') return false; // late-join rejected
    this.players.set(id, { id, name, score: 0, answers: {} });
    this.cb.onStateChange();
    return true;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.cb.onStateChange();
    if (this.phase === 'question') {
      this._recountAndMaybeAdvance();
    }
  }

  getPlayers(): Player[] {
    return [...this.players.values()];
  }

  // ── game control ───────────────────────────────────────────────────────

  startGame(): void {
    if (this.phase !== 'lobby') return;
    this._advanceQuestion(0);
  }

  forceNext(): void {
    this._clearTimer();
    if (this.phase === 'question') {
      if (this.mode === 'sofort') {
        this._revealOrAdvance(this.questionIndex);
      } else {
        this._advanceQuestion(this.questionIndex + 1);
      }
    } else if (this.phase === 'reveal') {
      this._advanceQuestion(this.questionIndex + 1);
    }
  }

  // ── answer handling ────────────────────────────────────────────────────

  /** Returns false if the answer was rejected (wrong phase / already answered / stale index). */
  submitAnswer(
    peerId: string,
    letter: 'a' | 'b' | 'c' | 'd',
    questionIndex: number,
  ): boolean {
    if (this.phase !== 'question') return false;
    if (questionIndex !== this.questionIndex) return false;
    const player = this.players.get(peerId);
    if (!player) return false;
    if (player.answers[this.questionIndex] != null) return false;

    player.answers[this.questionIndex] = letter;
    if (letter === this.questions[this.questionIndex]?.solution) player.score += 1;

    this._recountAndMaybeAdvance();
    return true;
  }

  submitHostAnswer(letter: 'a' | 'b' | 'c' | 'd'): boolean {
    return this.submitAnswer('host', letter, this.questionIndex);
  }

  // ── scoring ────────────────────────────────────────────────────────────

  buildScores(): { id: string; name: string; score: number }[] {
    return [...this.players.values()]
      .map(({ id, name, score }) => ({ id, name, score }))
      .sort((a, b) => b.score - a.score);
  }

  destroy(): void {
    this._clearTimer();
  }

  // ── private helpers ────────────────────────────────────────────────────

  private _advanceQuestion(idx: number): void {
    this._clearTimer();

    if (idx >= this.questions.length) {
      this.phase = 'finished';
      this.cb.onStateChange();
      this.cb.onBroadcast({ type: 'FINISH', scores: this.buildScores() });
      return;
    }

    this.questionIndex = idx;
    this.answeredCount = 0;
    this.revealLetter = null;
    this.players.forEach((p) => { p.answers[idx] = null; });

    this.phase = 'question';
    this.cb.onStateChange();
    this.cb.onBroadcast({
      type: 'QUESTION',
      q: this.questions[idx],
      index: idx,
      timeLimit: this.secondsPerQuestion,
    });

    this.timer = this.cb.onTimer(
      this.secondsPerQuestion * 1000,
      () => this._revealOrAdvance(idx),
    );
  }

  private _revealOrAdvance(idx: number): void {
    this._clearTimer();
    if (this.phase !== 'question') return;
    const correct = this.questions[idx]?.solution;
    if (!correct) return;

    if (this.mode === 'sofort') {
      this.phase = 'reveal';
      this.revealLetter = correct;
      this.cb.onStateChange();
      this.cb.onBroadcast({ type: 'REVEAL', correctLetter: correct, scores: this.buildScores() });
      this.timer = this.cb.onTimer(4000, () => this._advanceQuestion(idx + 1));
    } else {
      this.timer = this.cb.onTimer(1000, () => this._advanceQuestion(idx + 1));
    }
  }

  private _recountAndMaybeAdvance(): void {
    const idx = this.questionIndex;
    const count = [...this.players.values()].filter((p) => p.answers[idx] != null).length;
    this.answeredCount = count;
    this.cb.onBroadcast({
      type: 'ANSWER_COUNT',
      count,
      total: this.players.size,
    });
    this.cb.onStateChange();
    if (count >= this.players.size && this.players.size > 0) {
      this._revealOrAdvance(idx);
    }
  }

  private _clearTimer(): void {
    if (this.timer !== null) {
      this.cb.onClearTimer(this.timer);
      this.timer = null;
    }
  }
}
