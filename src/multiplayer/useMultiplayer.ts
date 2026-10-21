import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Question } from '../types';
import { ClientErrorKind, ClientMsg, HostMsg, Player, RoomMode, RoomPhase, RoomState } from './types';

const PING_INTERVAL_MS = 8_000;       // host pings every 8s (3G-friendly)
const PING_TIMEOUT_MS  = 30_000;      // drop if no PONG within 30s in active game (covers ~3G RTT)
const LOBBY_PING_TIMEOUT_MS = 60_000; // in lobby, give 60s timeout so backgrounded host/clients aren't dropped

// STUN and TURN configuration:
// Google STUN is always included (works out of the box for all forks and direct P2P).
// If dedicated TURN server credentials are provided via Vite env variables, we add them
// for relaying through strict firewalls and AP client isolation (UDP 3478 + TCP 443 fallback).
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnServer = import.meta.env.VITE_TURN_SERVER;
  const username = import.meta.env.VITE_TURN_USER;
  const credential = import.meta.env.VITE_TURN_PASS;

  if (turnServer && username && credential) {
    servers.push(
      {
        urls: `turn:${turnServer}:3478`,
        username,
        credential,
      },
      {
        urls: `turn:${turnServer}:3478?transport=tcp`,
        username,
        credential,
      },
      {
        urls: `turn:${turnServer}:443?transport=tcp`,
        username,
        credential,
      },
      {
        urls: `turn:${turnServer}:443`,
        username,
        credential,
      },
    );
  }

  return servers;
}

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = buildIceServers();

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
  enabled?: boolean;
}

export function useMultiplayerHost({
  questions,
  mode,
  secondsPerQuestion,
  hostName,
  enabled = true,
}: UseHostOptions) {
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
    if (!enabled) return;
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
    if (phaseRef.current === 'lobby') {
      const players = [...playersRef.current.values()].map(({ id, name }) => ({ id, name }));
      connsRef.current.forEach((conn) => {
        if (conn.open) conn.send({ type: 'PLAYER_LIST', players });
      });
    }
  }, [enabled, hostName, refreshPlayers]);

  const broadcast = useCallback((msg: HostMsg) => {
    connsRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg);
    });
  }, []);

  // Broadcast current player list to all clients (lobby only)
  const broadcastPlayerList = useCallback(() => {
    if (phaseRef.current !== 'lobby') return;
    const players = [...playersRef.current.values()].map(({ id, name }) => ({ id, name }));
    broadcast({ type: 'PLAYER_LIST', players });
  }, [broadcast]);

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
      // Notify all waiting clients of the updated player list
      broadcastPlayerList();
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
  }, [questions, roomCode, buildScores, broadcast, refreshPlayers, broadcastPlayerList]);

  const handleClientMsgRef = useRef(handleClientMsg);
  handleClientMsgRef.current = handleClientMsg;

  // Broadcast updated room settings to waiting clients in lobby
  useEffect(() => {
    if (!enabled || phaseRef.current !== 'lobby' || !roomCode) return;
    const state: RoomState = {
      roomCode,
      mode,
      secondsPerQuestion,
      phase: 'lobby',
      questionIndex: 0,
      totalQuestions: questions.length,
      answeredCount: 0,
      playerCount: playersRef.current.size,
      scores: buildScores(),
    };
    broadcast({ type: 'STATE', state });
  }, [enabled, mode, secondsPerQuestion, roomCode, questions.length, buildScores, broadcast]);

  // Initialise host Peer
  useEffect(() => {
    if (!enabled) return;
    const code = genRoomCode();
    setRoomCode(code);
    const peer = new Peer(`lid-${code}`, {
      // ponytail: using public PeerJS cloud with OpenRelay TURN fallback for strict NAT/firewalls
      host: '0.peerjs.com', port: 443, secure: true, path: '/',
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    });
    peerRef.current = peer;

    // ── Heartbeat ──────────────────────────────────────────────────────────
    // Track last PONG time per peer; drop connection if silent too long.
    const lastPong = new Map<string, number>();

    const removePeer = (peerId: string) => {
      connsRef.current.delete(peerId);
      lastPong.delete(peerId);
      playersRef.current.delete(peerId);
      refreshPlayers();
      if (phaseRef.current === 'lobby') {
        // Update waiting clients
        const players = [...playersRef.current.values()].map(({ id, name }) => ({ id, name }));
        broadcast({ type: 'PLAYER_LIST', players });
      } else if (phaseRef.current === 'question') {
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
    };

    const pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = phaseRef.current === 'lobby' ? LOBBY_PING_TIMEOUT_MS : PING_TIMEOUT_MS;
      connsRef.current.forEach((conn, id) => {
        if (!conn.open) return;
        // Drop if overdue
        const last = lastPong.get(id) ?? now; // grace: treat new conn as just-ponged
        if (now - last > timeout) {
          conn.close();
          removePeer(id);
          return;
        }
        conn.send({ type: 'PING' } satisfies HostMsg);
      });
    }, PING_INTERVAL_MS);

    // Auto-reconnect host when returning from background (e.g. sharing room link in messenger)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // 1. Give all connected clients a fresh grace period for ping/pong so they aren't pruned immediately
        const now = Date.now();
        connsRef.current.forEach((_, id) => {
          lastPong.set(id, now);
        });
        // 2. Reconnect host peer to signaling server if it was disconnected
        if (peerRef.current && !peerRef.current.destroyed && peerRef.current.disconnected) {
          try {
            peerRef.current.reconnect();
          } catch {
            // ignore
          }
        }
        if (phaseRef.current === 'lobby') {
          setError(null);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    peer.on('error', (err: any) => {
      const type = err?.type;
      // In lobby, backgrounding app often closes signaling socket or causes transient network errors
      if (phaseRef.current === 'lobby' && (type === 'socket-closed' || type === 'socket-error' || type === 'network')) {
        if (peer.disconnected && !peer.destroyed) {
          try {
            peer.reconnect();
          } catch {
            // ignore
          }
        }
        return;
      }
      setError(String(err?.message || err));
    });

    peer.on('disconnected', () => {
      if (phaseRef.current === 'lobby' && !peer.destroyed) {
        try {
          peer.reconnect();
        } catch {
          // ignore
        }
      }
    });

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
        removePeer(conn.peer);
      });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pingInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
      peer.destroy();
    };
  }, [enabled, refreshPlayers, broadcast]);

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

  // End session early – shows final leaderboard to all
  const hostEndEarly = useCallback(() => {
    if (phaseRef.current === 'finished') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    phaseRef.current = 'finished';
    setPhase('finished');
    const scores = buildScores();
    broadcast({ type: 'FINISH', scores });
  }, [buildScores, broadcast]);

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

  const reconnectHost = useCallback(() => {
    setError(null);
    if (peerRef.current && !peerRef.current.destroyed) {
      if (peerRef.current.disconnected) {
        try {
          peerRef.current.reconnect();
        } catch {
          // ignore
        }
      }
    }
  }, []);

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
    reconnectHost,
    startGame,
    hostForceNext,
    hostEndEarly,
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
  const [errorKind, setErrorKind] = useState<ClientErrorKind | null>(null);
  const [errorTip, setErrorTip] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retryConnect = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

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
  const phaseRef = useRef<RoomPhase>('lobby');
  phaseRef.current = phase;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [lobbyPlayers, setLobbyPlayers] = useState<{ id: string; name: string }[]>([]);
  // True while host is silent (missed ≥1 ping cycle) but not yet timed out
  const [hostSilent, setHostSilent] = useState(false);

  useEffect(() => {
    // Always reset when deps change — MUST be before the early-return guard so that
    // clearing joinCode (going back) wipes the stale error immediately.
    setError(null);
    setErrorTip(null);
    setErrorKind(null);
    setConnected(false);
    setHostSilent(false);
    setPhase('lobby');
    setLobbyPlayers([]);
    setScores([]);

    if (!roomCode || !playerName) return;

    let cancelled = false;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let errorTimer:   ReturnType<typeof setTimeout> | null = null;

    const clearWatchdogs = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      if (errorTimer)   { clearTimeout(errorTimer);   errorTimer   = null; }
    };

    const fireDisconnect = () => {
      if (cancelled) return;
      clearWatchdogs();
      setConnected(false);
      setHostSilent(false);
      if (phaseRef.current === 'finished') return;
      setError('Verbindung zum Host wurde getrennt.');
      setErrorTip('Keine Antwort mehr vom Host. Möglicherweise hat der Host das Spiel beendet oder die Internetverbindung ist unterbrochen.');
      setErrorKind('host_disconnected');
      peer.destroy();
    };

    // Called on every received PING — resets both tiers
    const resetWatchdog = () => {
      if (cancelled) return;
      clearWatchdogs();
      setHostSilent(false);
      // Tier 1: after missed ping cycle (with 2x buffer for mobile/jitter) → show "host silent" banner
      silenceTimer = setTimeout(() => {
        if (cancelled) return;
        setHostSilent(true);
        // Tier 2: after full timeout with no ping → error
        errorTimer = setTimeout(fireDisconnect, PING_TIMEOUT_MS);
      }, PING_INTERVAL_MS * 2);
    };

    const peer = new Peer(undefined as unknown as string, {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      path: '/',
      config: {
        iceServers: DEFAULT_ICE_SERVERS,
      },
    });

    // 30s connection timeout: allows time for STUN/TURN allocation and mobile host app switching
    const connectTimer = setTimeout(() => {
      if (cancelled) return;
      setError('Verbindung fehlgeschlagen (Zeitüberschreitung).');
      setErrorTip('Möglicherweise blockiert das lokale WLAN (Client-Isolation / Firewall) direkte Verbindungen oder der Host hat die App gewechselt. Versuche mobile Daten (Hotspot/LTE) oder starte die Verbindung neu.');
      setErrorKind('timeout');
      peer.destroy();
    }, 30000);

    peer.on('open', (id) => {
      if (cancelled) return;
      setMyPeerId(id);
      const conn = peer.connect(`lid-${roomCode}`, { reliable: true });
      connRef.current = conn;

      // Listen for ICE connection failure (indicates Wi-Fi client isolation or UDP blocked)
      // ponytail: peerConnection may not be set immediately — retry once after 200ms, but guard against double-listener
      let iceListenerAdded = false;
      const checkIceFailure = () => {
        if (iceListenerAdded) return;
        const pc = conn.peerConnection;
        if (pc) {
          iceListenerAdded = true;
          pc.addEventListener('iceconnectionstatechange', () => {
            if (pc.iceConnectionState === 'failed') {
              clearTimeout(connectTimer);
              clearWatchdogs();
              if (cancelled || phaseRef.current === 'finished') return;
              setConnected(false);
              setError('Verbindung durch lokales Netzwerk blockiert (ICE-Fehler).');
              setErrorTip('In vielen öffentlichen oder geschützten WLANs (Schule, Hotel, Gast-WLAN) sind P2P-Verbindungen blockiert (AP-Isolation/UDP). Bitte teste mobile Daten (LTE/5G) oder einen Hotspot.');
              setErrorKind('webrtc_blocked');
              peer.destroy();
            }
          });
        }
      };
      checkIceFailure();
      setTimeout(checkIceFailure, 200);

      conn.on('open', () => {
        clearTimeout(connectTimer);
        setConnected(true);
        conn.send({ type: 'JOIN', name: playerName } satisfies ClientMsg);
        // Start initial watchdog — first PING may be up to PING_INTERVAL_MS away
        resetWatchdog();
      });

      conn.on('error', (err) => {
        clearTimeout(connectTimer);
        if (cancelled) return;
        setError('Verbindungsfehler: ' + String((err as Error)?.message || err));
        setErrorTip('Direkte Verbindung zum Host konnte nicht aufgebaut werden. Versuche es erneut oder prüfe die Internetverbindung.');
        setErrorKind('generic');
      });

      conn.on('data', (data) => {
        if (cancelled) return;
        const msg = data as HostMsg;
        if (msg.type === 'PING') {
          conn.send({ type: 'PONG' } satisfies ClientMsg);
          resetWatchdog();
          return;
        }
        if (msg.type === 'REJECTED') {
          clearTimeout(connectTimer);
          peer.destroy();
          setError('Das Spiel hat bereits begonnen.');
          setErrorTip('Neue Spieler können nur in der Lobby beitreten, bevor der Spielleiter die Fragen startet.');
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
          phaseRef.current = 'finished';
          setScores(msg.scores);
          setPhase('finished');
        }
        if (msg.type === 'KICK') {
          clearTimeout(connectTimer);
          peer.destroy();
          setError('Sie wurden aus dem Spiel entfernt.');
          setErrorTip('Der Spielleiter hat Sie aus dem Raum entfernt.');
          setErrorKind('generic');
        }
        if (msg.type === 'PLAYER_LIST') {
          setLobbyPlayers(msg.players);
        }
      });

      conn.on('close', () => {
        clearTimeout(connectTimer);
        clearWatchdogs();
        if (cancelled) return;
        setConnected(false);
        setHostSilent(false);
        // If we're already on the finished screen, keep it — don't overlay an error
        if (phaseRef.current === 'finished') return;
        setError('Verbindung zum Host wurde getrennt.');
        setErrorTip('Der Host hat das Spiel beendet, die App geschlossen oder das Netzwerk verloren.');
        setErrorKind('host_disconnected');
      });
    });

    peer.on('error', (err) => {
      clearTimeout(connectTimer);
      if (cancelled || phaseRef.current === 'finished') return;
      const isPeerUnavailable = (err as { type?: string }).type === 'peer-unavailable';
      if (isPeerUnavailable) {
        setError('Raum nicht gefunden oder Host ist offline.');
        setErrorTip('Überprüfe den 4-stelligen Raumcode. Der Host muss das Spiel im Vordergrund geöffnet haben.');
        setErrorKind('peer_unavailable');
      } else {
        setError(String((err as Error)?.message || err));
        setErrorTip('Fehler beim Verbindungsaufbau zum PeerJS-Signaldienst. Prüfe deine Internetverbindung.');
        setErrorKind('generic');
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(connectTimer);
      clearWatchdogs();
      peer.destroy();
    };
  }, [roomCode, playerName, retryCount]);

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
    errorTip,
    retryConnect,
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
    lobbyPlayers,
    hostSilent,
  };
}
