import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Question } from '../types';
import { ClientMsg, HostMsg, Player, RoomMode, RoomPhase, RoomState } from './types';

const PING_INTERVAL_MS = 5_000;   // host pings every 5s
const PING_TIMEOUT_MS  = 15_000;  // drop if no PONG within 15s

// Generate a short, human-readable room code (4 uppercase alphanumeric chars)
function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 ambiguity
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── HOST HOOK ────────────────────────────────────────────────────────────────

export interface UseHostOptions {
  questions: Question[];
  mode: RoomMode;
  secondsPerQuestion: number;
  hostName: string;
}

export function useMultiplayerHost({ questions, mode, secondsPerQuestion, hostName }: UseHostOptions) {
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<Map<string, DataConnection>>(new Map());
  const playersRef = useRef<Map<string, Player>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authoritative refs to avoid stale closure in peer callbacks
  const phaseRef = useRef<RoomPhase>('lobby');
  const questionIndexRef = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const secondsPerQuestionRef = useRef(secondsPerQuestion);
  secondsPerQuestionRef.current = secondsPerQuestion;
  const answeredCountRef = useRef(0);

  const [roomCode, setRoomCode] = useState<string>('');
  const [phase, setPhase] = useState<RoomPhase>('lobby');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [revealLetter, setRevealLetter] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [hostAnswer, setHostAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);

  const refreshPlayers = useCallback(() => {
    setPlayerList([...playersRef.current.values()]);
  }, []);

  // Initialize and update host in playersRef
  useEffect(() => {
    const existingHost = playersRef.current.get('host');
    if (existingHost) {
      existingHost.name = hostName || 'Host';
    } else {
      playersRef.current.set('host', {
        id: 'host',
        name: hostName || 'Host',
        score: 0,
        answers: {},
      });
    }
    refreshPlayers();
  }, [hostName, refreshPlayers]);

  const broadcast = useCallback((msg: HostMsg) => {
    connsRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg);
    });
  }, []);

  const buildScores = useCallback(() =>
    [...playersRef.current.values()]
      .map(({ id, name, score }) => ({ id, name, score }))
      .sort((a, b) => b.score - a.score),
  []);

  // Advance to next question or finish
  const advanceQuestion = useCallback((nextIdx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (nextIdx >= questions.length) {
      phaseRef.current = 'finished';
      setPhase('finished');
      const scores = buildScores();
      broadcast({ type: 'FINISH', scores });
      return;
    }

    questionIndexRef.current = nextIdx;
    setQuestionIndex(nextIdx);
    answeredCountRef.current = 0;
    setAnsweredCount(0);
    setHostAnswer(null);
    setRevealLetter(null);

    // Reset per-question answer tracking in players
    playersRef.current.forEach((p) => {
      p.answers[nextIdx] = null;
    });

    phaseRef.current = 'question';
    setPhase('question');
    broadcast({
      type: 'QUESTION',
      q: questions[nextIdx],
      index: nextIdx,
      timeLimit: secondsPerQuestionRef.current,
    });

    // Auto-advance after timer
    timerRef.current = setTimeout(() => {
      revealOrAdvance(nextIdx);
    }, secondsPerQuestionRef.current * 1000);
  }, [questions, broadcast, buildScores]); // revealOrAdvance bound below

  // Ref bridge for circular dependency between advanceQuestion & revealOrAdvance
  const advanceQuestionRef = useRef(advanceQuestion);
  advanceQuestionRef.current = advanceQuestion;

  const revealOrAdvance = useCallback((idx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (phaseRef.current !== 'question') return;

    const correct = questions[idx]?.solution;
    if (!correct) return;

    if (modeRef.current === 'sofort') {
      phaseRef.current = 'reveal';
      setPhase('reveal');
      setRevealLetter(correct);
      const scores = buildScores();
      broadcast({ type: 'REVEAL', correctLetter: correct, scores });
      // Auto-advance after reveal pause (4 sec)
      timerRef.current = setTimeout(() => advanceQuestionRef.current(idx + 1), 4000);
    } else {
      // Pause briefly (1 sec) so the player sees their selected answer (as in exam mode)
      timerRef.current = setTimeout(() => advanceQuestionRef.current(idx + 1), 1000);
    }
  }, [questions, buildScores, broadcast]);

  const revealOrAdvanceRef = useRef(revealOrAdvance);
  revealOrAdvanceRef.current = revealOrAdvance;

  // Handle incoming client message
  const handleClientMsg = useCallback((peerId: string, msg: ClientMsg) => {
    if (msg.type === 'JOIN') {
      // Reject late joiners
      if (phaseRef.current !== 'lobby') {
        const conn = connsRef.current.get(peerId);
        if (conn?.open) conn.send({ type: 'REJECTED', reason: 'game_in_progress' } satisfies HostMsg);
        return;
      }

      const player: Player = { id: peerId, name: msg.name, score: 0, answers: {} };
      playersRef.current.set(peerId, player);
      refreshPlayers();

      // Send current state to the new joiner
      const conn = connsRef.current.get(peerId);
      if (conn?.open) {
        const state: RoomState = {
          roomCode,
          mode: modeRef.current,
          secondsPerQuestion: secondsPerQuestionRef.current,
          phase: phaseRef.current,
          questionIndex: questionIndexRef.current,
          totalQuestions: questions.length,
          answeredCount: answeredCountRef.current,
          playerCount: playersRef.current.size,
          scores: buildScores(),
        };
        conn.send({ type: 'STATE', state } satisfies HostMsg);
      }
      broadcast({
        type: 'ANSWER_COUNT',
        count: answeredCountRef.current,
        total: playersRef.current.size,
      });
    }

    if (msg.type === 'ANSWER') {
      const player = playersRef.current.get(peerId);
      if (!player || phaseRef.current !== 'question') return;
      const curIdx = questionIndexRef.current;
      if (msg.questionIndex !== undefined && msg.questionIndex !== curIdx) return;
      // Only count first answer
      if (player.answers[curIdx] != null) return;

      player.answers[curIdx] = msg.letter;
      if (msg.letter === questions[curIdx]?.solution) {
        player.score += 1;
      }

      const count = [...playersRef.current.values()].filter(
        (p) => p.answers[curIdx] != null
      ).length;
      answeredCountRef.current = count;
      setAnsweredCount(count);
      broadcast({ type: 'ANSWER_COUNT', count, total: playersRef.current.size });

      // All answered → move on early
      if (count >= playersRef.current.size) {
        revealOrAdvanceRef.current(curIdx);
      }
    }
  }, [questions, roomCode, buildScores, broadcast, refreshPlayers]);

  const handleClientMsgRef = useRef(handleClientMsg);
  handleClientMsgRef.current = handleClientMsg;

  // Initialise host Peer
  useEffect(() => {
    const code = genRoomCode();
    setRoomCode(code);
    const peer = new Peer(`lid-${code}`, {
      // ponytail: using public PeerJS cloud; replace host/path for self-hosted
      host: '0.peerjs.com', port: 443, secure: true, path: '/'
    });
    peerRef.current = peer;

    // ── Heartbeat ──────────────────────────────────────────────────────────
    // Track last PONG time per peer; drop connection if silent too long.
    const lastPong = new Map<string, number>();

    const pingInterval = setInterval(() => {
      const now = Date.now();
      connsRef.current.forEach((conn, id) => {
        if (!conn.open) return;
        // Drop if overdue
        const last = lastPong.get(id) ?? now; // grace: treat new conn as just-ponged
        if (now - last > PING_TIMEOUT_MS) {
          conn.close();
          return;
        }
        conn.send({ type: 'PING' } satisfies HostMsg);
      });
    }, PING_INTERVAL_MS);

    peer.on('error', (err) => setError(String(err)));
    peer.on('connection', (conn) => {
      connsRef.current.set(conn.peer, conn);
      lastPong.set(conn.peer, Date.now()); // initialise on connect
      conn.on('data', (data) => {
        const msg = data as ClientMsg;
        if (msg.type === 'PONG') {
          lastPong.set(conn.peer, Date.now());
          return;
        }
        handleClientMsgRef.current(conn.peer, msg);
      });
      conn.on('close', () => {
        connsRef.current.delete(conn.peer);
        lastPong.delete(conn.peer);
        playersRef.current.delete(conn.peer);
        refreshPlayers();
        if (phaseRef.current === 'question') {
          const curIdx = questionIndexRef.current;
          const count = [...playersRef.current.values()].filter(
            (p) => p.answers[curIdx] != null
          ).length;
          answeredCountRef.current = count;
          setAnsweredCount(count);
          connsRef.current.forEach((c) => {
            if (c.open) c.send({ type: 'ANSWER_COUNT', count, total: playersRef.current.size });
          });
          if (count >= playersRef.current.size && playersRef.current.size > 0) {
            revealOrAdvanceRef.current(curIdx);
          }
        }
      });
    });

    return () => {
      clearInterval(pingInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
      peer.destroy();
    };
  }, [refreshPlayers]);

  const startGame = useCallback(() => advanceQuestion(0), [advanceQuestion]);

  const hostForceNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (phaseRef.current === 'question') {
      if (modeRef.current === 'sofort') {
        revealOrAdvance(questionIndexRef.current);
      } else {
        advanceQuestion(questionIndexRef.current + 1);
      }
    } else if (phaseRef.current === 'reveal') {
      advanceQuestion(questionIndexRef.current + 1);
    }
  }, [revealOrAdvance, advanceQuestion]);

  // Host submits their own answer
  const hostSubmitAnswer = useCallback((letter: 'a' | 'b' | 'c' | 'd') => {
    if (phaseRef.current !== 'question') return;
    const curIdx = questionIndexRef.current;
    const hostPlayer = playersRef.current.get('host');
    if (!hostPlayer || hostPlayer.answers[curIdx] != null) return;

    hostPlayer.answers[curIdx] = letter;
    setHostAnswer(letter);
    if (letter === questions[curIdx]?.solution) {
      hostPlayer.score += 1;
    }

    const count = [...playersRef.current.values()].filter(
      (p) => p.answers[curIdx] != null
    ).length;
    answeredCountRef.current = count;
    setAnsweredCount(count);
    broadcast({ type: 'ANSWER_COUNT', count, total: playersRef.current.size });

    if (count >= playersRef.current.size) {
      revealOrAdvanceRef.current(curIdx);
    }
  }, [questions, broadcast]);

  return {
    roomCode,
    phase,
    questionIndex,
    currentQuestion: questions[questionIndex] ?? null,
    playerList,
    answeredCount,
    revealLetter,
    hostAnswer,
    hostSubmitAnswer,
    hostAnswers: playersRef.current.get('host')?.answers || {},
    error,
    startGame,
    hostForceNext,
    buildScores,
    totalPlayers: playerList.length,
  };
}

// ─── CLIENT HOOK ──────────────────────────────────────────────────────────────

export function useMultiplayerClient(roomCode: string, playerName: string) {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'host_disconnected' | 'rejected' | 'generic' | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [myAnswers, setMyAnswers] = useState<Record<number, 'a' | 'b' | 'c' | 'd' | null>>({});
  const [timeLimit, setTimeLimit] = useState(60);
  const [myAnswer, setMyAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [revealLetter, setRevealLetter] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [scores, setScores] = useState<RoomState['scores']>([]);
  const [phase, setPhase] = useState<RoomPhase>('lobby');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myPeerId, setMyPeerId] = useState<string>('');

  useEffect(() => {
    if (!roomCode || !playerName) return;

    const peer = new Peer(undefined as unknown as string, {
      host: '0.peerjs.com', port: 443, secure: true, path: '/'
    });
    const connectTimer = setTimeout(() => {
      setError('Verbindung fehlgeschlagen (Zeitüberschreitung). Host ist möglicherweise offline.');
      setErrorKind('generic');
      peer.destroy();
    }, 15000);

    peer.on('open', (id) => {
      setMyPeerId(id);
      const conn = peer.connect(`lid-${roomCode}`, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        clearTimeout(connectTimer);
        setConnected(true);
        conn.send({ type: 'JOIN', name: playerName } satisfies ClientMsg);
      });

      conn.on('error', (err) => {
        clearTimeout(connectTimer);
        setError('Verbindungsfehler: ' + String((err as Error)?.message || err));
        setErrorKind('generic');
      });

      conn.on('data', (data) => {
        const msg = data as HostMsg;
        if (msg.type === 'PING') {
          conn.send({ type: 'PONG' } satisfies ClientMsg);
          return;
        }
        if (msg.type === 'REJECTED') {
          clearTimeout(connectTimer);
          peer.destroy();
          setError('Das Spiel hat bereits begonnen. Bitte warte auf die nächste Runde.');
          setErrorKind('rejected');
          return;
        }
        if (msg.type === 'STATE') {
          setRoomState(msg.state);
          setPhase(msg.state.phase);
          setAnsweredCount(msg.state.answeredCount);
          setTotalPlayers(msg.state.playerCount);
        }
        if (msg.type === 'QUESTION') {
          setCurrentQuestion(msg.q);
          setAllQuestions((prev) => {
            const next = [...prev];
            next[msg.index] = msg.q;
            return next;
          });
          setTimeLimit(msg.timeLimit);
          setMyAnswer(null);
          setRevealLetter(null);
          setAnsweredCount(0);
          setPhase('question');
          setQuestionIndex(msg.index);
        }
        if (msg.type === 'ANSWER_COUNT') {
          setAnsweredCount(msg.count);
          setTotalPlayers(msg.total);
        }
        if (msg.type === 'REVEAL') {
          setRevealLetter(msg.correctLetter);
          setScores(msg.scores);
          setPhase('reveal');
        }
        if (msg.type === 'FINISH') {
          setScores(msg.scores);
          setPhase('finished');
        }
        if (msg.type === 'KICK') {
          clearTimeout(connectTimer);
          peer.destroy();
          setError('Sie wurden aus dem Spiel entfernt.');
          setErrorKind('generic');
        }
      });

      conn.on('close', () => {
        clearTimeout(connectTimer);
        setConnected(false);
        setError('Verbindung zum Host wurde getrennt.');
        setErrorKind('host_disconnected');
      });
    });

    peer.on('error', (err) => {
      clearTimeout(connectTimer);
      const isPeerUnavailable = (err as { type?: string }).type === 'peer-unavailable';
      const message = isPeerUnavailable
        ? 'Raum nicht gefunden oder Host ist offline. Bitte Raumcode überprüfen.'
        : String((err as Error)?.message || err);
      setError(message);
      setErrorKind('generic');
    });

    return () => {
      clearTimeout(connectTimer);
      peer.destroy();
    };
  }, [roomCode, playerName]);

  const sendAnswer = useCallback((letter: 'a' | 'b' | 'c' | 'd') => {
    if (myAnswer !== null || phase !== 'question') return;
    setMyAnswer(letter);
    setMyAnswers((prev) => ({ ...prev, [questionIndex]: letter }));
    connRef.current?.send({
      type: 'ANSWER',
      letter,
      questionIndex,
    } satisfies ClientMsg);
  }, [myAnswer, phase, questionIndex]);

  return {
    connected,
    error,
    errorKind,
    roomState,
    currentQuestion,
    allQuestions,
    myAnswers,
    timeLimit,
    myAnswer,
    answeredCount,
    totalPlayers,
    revealLetter,
    scores,
    phase,
    questionIndex,
    sendAnswer,
    myPeerId,
  };
}
