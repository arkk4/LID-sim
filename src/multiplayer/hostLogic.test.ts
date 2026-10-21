/**
 * Tests for HostLogic: the pure multiplayer host state machine.
 * Covers all edge cases: player disconnect, host disconnect path,
 * late join, duplicate answers, stale-index answers, timer auto-advance.
 *
 * Run: npx vitest run
 */

import { describe, it, expect, vi } from 'vitest';
import { HostLogic, HostLogicCallbacks } from './hostLogic';
import { Question } from '../types';
import { RoomMode } from './types';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeQuestions(n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    num: String(i + 1),
    question: `Q${i + 1}`,
    a: 'A', b: 'B', c: 'C', d: 'D',
    solution: 'a' as const,
  }));
}

function makeLogic(
  questions: Question[],
  {
    mode = 'abschluss' as RoomMode,
    secondsPerQuestion = 30,
    hostName = 'Host',
    broadcast = vi.fn(),
    stateChange = vi.fn(),
  }: {
    mode?: RoomMode;
    secondsPerQuestion?: number;
    hostName?: string;
    broadcast?: ReturnType<typeof vi.fn>;
    stateChange?: ReturnType<typeof vi.fn>;
  } = {},
): { logic: HostLogic; timers: Map<number, () => void>; broadcast: ReturnType<typeof vi.fn> } {
  const timers = new Map<number, () => void>();
  let nextTimerId = 1;

  const cb: HostLogicCallbacks = {
    onStateChange: stateChange as () => void,
    onBroadcast: broadcast as (msg: object) => void,
    onTimer: (_ms, fn) => {
      const id = nextTimerId++;
      timers.set(id, fn);
      return id;
    },
    onClearTimer: (id) => timers.delete(id),
  };

  return { logic: new HostLogic(questions, mode, secondsPerQuestion, hostName, cb), timers, broadcast };
}

/** Fire all pending timers currently queued (simulates one timer tick). */
function flushTimers(timers: Map<number, () => void>) {
  for (const [id, fn] of [...timers.entries()]) {
    timers.delete(id);
    fn();
  }
}

// ── basic game flow ────────────────────────────────────────────────────────────

describe('basic flow', () => {
  it('starts in lobby', () => {
    const { logic } = makeLogic(makeQuestions(2));
    expect(logic.phase).toBe('lobby');
  });

  it('transitions to question on startGame', () => {
    const { logic, broadcast } = makeLogic(makeQuestions(2));
    logic.startGame();
    expect(logic.phase).toBe('question');
    expect(logic.questionIndex).toBe(0);
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'QUESTION', index: 0 }));
  });

  it('goes to finished after last question', () => {
    const { logic, timers, broadcast } = makeLogic(makeQuestions(1));
    logic.startGame();
    flushTimers(timers); // timer fires → revealOrAdvance → schedules 1s pause
    flushTimers(timers); // 1s pause fires → advanceQuestion(1) → finished
    expect(logic.phase).toBe('finished');
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'FINISH' }));
  });

  it('abschluss mode skips reveal phase and pauses 1s for answer highlight', () => {
    const { logic, timers, broadcast } = makeLogic(makeQuestions(2), { mode: 'abschluss' });
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitAnswer('p1', 'a', 0);
    logic.submitHostAnswer('a'); // all answered → scheduled 1s pause for answer highlight
    // During 1s pause, still on question 0 so players see their choice highlighted
    expect(logic.questionIndex).toBe(0);
    flushTimers(timers); // 1s timer expires → advances
    // Should jump straight to question 1, no reveal broadcast
    const reveals = (broadcast as ReturnType<typeof vi.fn>).mock.calls.filter(
      (args: unknown[]) => (args[0] as { type: string }).type === 'REVEAL',
    );
    expect(reveals).toHaveLength(0);
    expect(logic.phase).toBe('question');
    expect(logic.questionIndex).toBe(1);
  });

  it('sofort mode broadcasts REVEAL then auto-advances', () => {
    const { logic, timers, broadcast } = makeLogic(makeQuestions(2), { mode: 'sofort' as const });
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitAnswer('p1', 'a', 0);
    logic.submitHostAnswer('a'); // all answered → reveal
    expect(logic.phase).toBe('reveal');
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'REVEAL' }));
    flushTimers(timers); // 4-sec reveal timer → question 1
    expect(logic.phase).toBe('question');
    expect(logic.questionIndex).toBe(1);
  });
});

// ── late join ──────────────────────────────────────────────────────────────────

describe('late join', () => {
  it('rejects addPlayer after game starts', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.startGame();
    const accepted = logic.addPlayer('latecomer', 'Late');
    expect(accepted).toBe(false);
    expect(logic.getPlayers().map((p) => p.id)).not.toContain('latecomer');
  });

  it('allows joining during lobby', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    expect(logic.getPlayers().map((p) => p.id)).toContain('p1');
  });
});

// ── player disconnect during question ──────────────────────────────────────────

describe('player disconnect', () => {
  it('recounts answers when disconnected player had already answered', () => {
    const { logic, broadcast } = makeLogic(makeQuestions(3));
    logic.addPlayer('p1', 'Alice');
    logic.addPlayer('p2', 'Bob');
    logic.startGame();
    // p1 answers; p2 disconnects → should NOT trigger advance (1/1 after remove)
    logic.submitAnswer('p1', 'a', 0);
    logic.removePlayer('p2');
    // Now p1 and host remain; p1 already answered; host hasn't
    // answeredCount should be 1, total players = 2 (host + p1)
    expect(broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'FINISH' }));
    expect(logic.phase).toBe('question'); // game didn't auto-finish
  });

  it('auto-advances when last unanswered player disconnects', () => {
    const { logic, timers } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitHostAnswer('a'); // host answers; p1 hasn't
    // p1 disconnects → host is only player left → all answered
    logic.removePlayer('p1');
    flushTimers(timers); // 1s highlight pause expires
    // With abschluss mode: should now be on question 1
    expect(logic.questionIndex).toBe(1);
    expect(logic.phase).toBe('question');
  });

  it('does not advance when players > 0 but none have answered yet', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    logic.addPlayer('p2', 'Bob');
    logic.startGame();
    // Nobody answered, p1 disconnects → 0 answered out of 2 remaining
    logic.removePlayer('p1');
    expect(logic.phase).toBe('question');
    expect(logic.questionIndex).toBe(0);
  });

  it('handles all players disconnecting gracefully (does not crash)', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    // Remove everyone except host, then host is alone — safe
    logic.removePlayer('p1');
    // Just checking it doesn't throw
    expect(logic.phase).toBeTruthy();
  });
});

// ── host disconnect (simulated: host = just another HostLogic instance) ────────

describe('host disconnect path', () => {
  it('destroy() clears pending timers', () => {
    const timers = new Map<number, () => void>();
    let nextId = 1;
    const cb: HostLogicCallbacks = {
      onStateChange: vi.fn(),
      onBroadcast: vi.fn(),
      onTimer: (_, fn) => { const id = nextId++; timers.set(id, fn); return id; },
      onClearTimer: (id) => timers.delete(id),
    };
    const logic = new HostLogic(makeQuestions(2), 'abschluss', 30, 'Host', cb);
    logic.startGame();
    expect(timers.size).toBe(1); // question timer pending
    logic.destroy();
    expect(timers.size).toBe(0); // cleared
  });
});

// ── duplicate / stale answers ──────────────────────────────────────────────────

describe('answer validation', () => {
  it('rejects a second answer from the same player', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    const first = logic.submitAnswer('p1', 'a', 0);
    const second = logic.submitAnswer('p1', 'b', 0);
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(logic.getPlayers().find((p) => p.id === 'p1')!.score).toBe(1); // only counted once
  });

  it('rejects an answer for the wrong question index (stale message)', () => {
    const { logic } = makeLogic(makeQuestions(3));
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    // Player sends answer tagged with index 1 but current is index 0
    const result = logic.submitAnswer('p1', 'a', 1);
    expect(result).toBe(false);
  });

  it('rejects answers outside question phase', () => {
    const { logic } = makeLogic(makeQuestions(2));
    const result = logic.submitAnswer('host', 'a', 0);
    expect(result).toBe(false); // still in lobby
  });

  it('unknown peerId is rejected', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.startGame();
    const result = logic.submitAnswer('ghost', 'a', 0);
    expect(result).toBe(false);
  });
});

// ── scoring & tie-breaking ─────────────────────────────────────────────────────

describe('scoring', () => {
  it('scores correct answer, not incorrect', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitAnswer('p1', 'b', 0); // wrong (solution is 'a')
    expect(logic.getPlayers().find((p) => p.id === 'p1')!.score).toBe(0);
  });

  it('buildScores returns sorted descending', () => {
    const { logic } = makeLogic(makeQuestions(3));
    logic.addPlayer('p1', 'Alice');
    logic.addPlayer('p2', 'Bob');
    logic.startGame();
    logic.submitAnswer('p1', 'a', 0); // Alice correct
    logic.submitAnswer('p2', 'b', 0); // Bob wrong
    logic.submitHostAnswer('a');       // Host correct → advance to q1
    logic.submitAnswer('p1', 'a', 1);
    logic.submitAnswer('p2', 'a', 1);
    logic.submitHostAnswer('b');       // advance to q2
    const scores = logic.buildScores();
    expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
    expect(scores[1].score).toBeGreaterThanOrEqual(scores[2].score);
  });
});

// ── forceNext ─────────────────────────────────────────────────────────────────

describe('forceNext', () => {
  it('in question phase: triggers reveal/advance', () => {
    const { logic } = makeLogic(makeQuestions(2), { mode: 'abschluss' });
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.forceNext(); // skip before anyone answers
    expect(logic.questionIndex).toBe(1);
  });

  it('in reveal phase: advances to next question', () => {
    const { logic } = makeLogic(makeQuestions(2), { mode: 'sofort' as const });
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitAnswer('p1', 'a', 0);
    logic.submitHostAnswer('a'); // → reveal
    expect(logic.phase).toBe('reveal');
    logic.forceNext(); // host skips the 4-sec reveal
    expect(logic.phase).toBe('question');
    expect(logic.questionIndex).toBe(1);
  });
});

// ── heartbeat: timer cleanup ───────────────────────────────────────────────────

describe('timer cleanup (heartbeat proxy)', () => {
  it('destroy() clears question timer so no stale advance fires', () => {
    const { logic, timers } = makeLogic(makeQuestions(3));
    logic.startGame();
    const beforeDestroy = timers.size;
    logic.destroy();
    expect(timers.size).toBe(0);
    expect(beforeDestroy).toBe(1); // had exactly one timer before
  });

  it('forceNext in question phase clears existing timer', () => {
    const { logic, timers } = makeLogic(makeQuestions(3), { mode: 'abschluss' });
    logic.startGame();
    expect(timers.size).toBe(1); // question timer
    logic.forceNext();           // clears it, creates new one for q1
    expect(timers.size).toBe(1); // still exactly 1 — new timer for next question
  });
});

// ── late join: addPlayer rejects mid-game ──────────────────────────────────────

describe('late join (mid-game)', () => {
  it('returns false when game already started', () => {
    const { logic } = makeLogic(makeQuestions(2));
    logic.startGame();
    expect(logic.addPlayer('late', 'Latecomer')).toBe(false);
    expect(logic.getPlayers().map(p => p.id)).not.toContain('late');
  });

  it('returns false even in reveal phase', () => {
    const { logic } = makeLogic(makeQuestions(2), { mode: 'sofort' as const });
    logic.addPlayer('p1', 'Alice');
    logic.startGame();
    logic.submitAnswer('p1', 'a', 0);
    logic.submitHostAnswer('a'); // → reveal
    expect(logic.phase).toBe('reveal');
    expect(logic.addPlayer('late', 'Latecomer')).toBe(false);
  });

  it('returns false when game is finished', () => {
    const { logic, timers } = makeLogic(makeQuestions(1));
    logic.startGame();
    flushTimers(timers); // question timer expires
    flushTimers(timers); // 1s pause expires → finished
    expect(logic.phase).toBe('finished');
    expect(logic.addPlayer('late', 'Latecomer')).toBe(false);
  });
});
