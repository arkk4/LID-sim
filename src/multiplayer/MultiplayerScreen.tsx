import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ChevronRight, Clock, Copy, GraduationCap, Users, Wifi, WifiOff } from 'lucide-react';
import { Question, BundeslandCode } from '../types';
import { RoomMode } from './types';
import {
  Leaderboard, PlayerAvatar, PlayerChip, QuestionCard, useCountdown,
} from './MultiComponents';
import { useMultiplayerHost, useMultiplayerClient } from './useMultiplayer';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExamQuestions(
  general: Question[],
  states: Record<string, Question[]>,
  selectedState: BundeslandCode
): Question[] {
  const regionalPool = states[selectedState.toUpperCase()] || [];
  return [
    ...shuffle(general).slice(0, 30),
    ...shuffle(regionalPool).slice(0, 3),
  ];
}

// ─── JOIN SCREEN (CLIENT ENTRY) ───────────────────────────────────────────────

function JoinScreen({ onJoin }: { onJoin: (code: string, name: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(() => localStorage.getItem('lid_mp_name') || '');
  const [err, setErr] = useState<string | null>(null);

  // Pre-fill code from URL ?room=XXXX
  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get('room');
    if (r) setCode(r.toUpperCase());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimCode = code.trim().toUpperCase();
    const trimName = name.trim();
    if (trimCode.length < 4) { setErr('Bitte einen 4-stelligen Raumcode eingeben.'); return; }
    if (!trimName) { setErr('Bitte geben Sie Ihren Namen ein.'); return; }
    localStorage.setItem('lid_mp_name', trimName);
    onJoin(trimCode, trimName);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center">
        <Wifi className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Spiel beitreten</h2>
        <p className="text-xs text-zinc-500 mt-1">Geben Sie den Raumcode und Ihren Namen ein</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
            Raumcode
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(null); }}
            placeholder="z. B. NW4X"
            maxLength={4}
            className="w-full text-center text-2xl font-mono tracking-[0.3em] uppercase h-14 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
            Ihr Name
          </label>
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-500">
            <PlayerAvatar name={name || 'X'} size={32} />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(null); }}
              placeholder="Name eingeben…"
              maxLength={24}
              className="flex-1 bg-transparent text-base font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer active:scale-95 transition-transform"
        >
          Beitreten
        </button>
      </form>
    </div>
  );
}

// ─── HOST LOBBY ───────────────────────────────────────────────────────────────

function HostLobbyScreen({
  roomCode, players, onStart,
  mode, setMode, secondsPerQuestion, setSecondsPerQuestion,
  hostName, setHostName,
}: {
  roomCode: string;
  players: { id: string; name: string; score: number }[];
  onStart: () => void;
  mode: RoomMode;
  setMode: (m: RoomMode) => void;
  secondsPerQuestion: number;
  setSecondsPerQuestion: (s: number) => void;
  hostName: string;
  setHostName: (n: string) => void;
}) {
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const copyLink = () => navigator.clipboard.writeText(joinUrl).catch(() => {});

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Room code */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Raumcode</p>
        <div className="text-5xl font-mono font-black tracking-[0.2em] text-zinc-900 dark:text-white mb-3">
          {roomCode}
        </div>
        <div className="flex justify-center mb-3">
          <QRCodeSVG value={joinUrl} size={120} bgColor="transparent"
            fgColor="currentColor" className="rounded-xl text-zinc-900 dark:text-white" />
        </div>
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          Link kopieren
        </button>
      </div>

      {/* Host profile */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 block">
          Ihr Spielername (Host)
        </label>
        <div className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 focus-within:ring-2 focus-within:ring-blue-500">
          <PlayerAvatar name={hostName || 'Host'} size={32} />
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Host-Name eingeben…"
            maxLength={24}
            className="flex-1 bg-transparent text-base font-medium text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Spieleinstellungen</p>

        {/* Mode toggle */}
        <div>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Auswertungsmodus</p>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { value: 'sofort' as const, label: 'Sofortige Auswertung', desc: 'Antwort nach jeder Frage' },
              { value: 'abschluss' as const, label: 'Abschlussauswertung', desc: 'Ergebnis am Ende' },
            ]).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${mode === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <div className="text-xs font-semibold">{label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Zeit pro Frage: {secondsPerQuestion} Sek.
          </p>
          <input
            type="range" min={20} max={120} step={10}
            value={secondsPerQuestion}
            onChange={(e) => setSecondsPerQuestion(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
            <span>20 Sek.</span><span>60 Sek.</span><span>120 Sek.</span>
          </div>
        </div>
      </div>

      {/* Player list */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          Teilnehmer ({players.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {players.length === 0
            ? <p className="text-xs text-zinc-400 italic">Noch keine Teilnehmer</p>
            : players.map((p) => <PlayerChip key={p.id} name={p.name} isHost={p.id === 'host'} />)
          }
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={players.length === 0}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-2 mt-auto"
      >
        <GraduationCap className="w-5 h-5" />
        Spiel starten ({players.length} Teilnehmer)
      </button>
    </div>
  );
}

// ─── CLIENT WAITING SCREEN ───────────────────────────────────────────────────

function ClientWaitingScreen({ name, roomCode }: { name: string; roomCode: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
      <PlayerAvatar name={name} size={64} />
      <div>
        <p className="font-bold text-zinc-900 dark:text-white">{name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">Raum: {roomCode}</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        Warten auf Spielstart…
      </div>
    </div>
  );
}

// ─── HOST GAME VIEW ───────────────────────────────────────────────────────────

function HostGameView({
  host, questions, mode, secondsPerQuestion,
}: {
  host: ReturnType<typeof useMultiplayerHost>;
  questions: Question[];
  mode: RoomMode;
  secondsPerQuestion: number;
}) {
  const { phase, questionIndex, currentQuestion, answeredCount, totalPlayers,
    revealLetter, hostAnswer, hostSubmitAnswer, hostForceNext, buildScores } = host;

  const secondsLeft = useCountdown(
    secondsPerQuestion,
    questionIndex,
    phase === 'question',
  );

  if (phase === 'finished') {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <Leaderboard
          scores={buildScores()}
          myId="host"
          totalQuestions={questions.length}
          questions={questions}
          myAnswers={host.hostAnswers}
          onClose={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <QuestionCard
        question={currentQuestion}
        questionIndex={questionIndex}
        totalQuestions={questions.length}
        myAnswer={hostAnswer}
        revealLetter={revealLetter}
        onAnswer={hostSubmitAnswer}
        answeredCount={answeredCount}
        totalPlayers={totalPlayers}
        secondsLeft={secondsLeft}
        secondsTotal={secondsPerQuestion}
        isHost
        onHostNext={hostForceNext}
        phase={phase}
      />
    </div>
  );
}

// ─── CLIENT GAME VIEW ─────────────────────────────────────────────────────────

function ClientGameView({
  client, playerName,
}: {
  client: ReturnType<typeof useMultiplayerClient>;
  playerName: string;
}) {
  const { phase, questionIndex, currentQuestion, myAnswer, revealLetter,
    answeredCount, totalPlayers, scores, timeLimit, sendAnswer, myPeerId,
    allQuestions, myAnswers } = client;

  const secondsLeft = useCountdown(timeLimit, questionIndex, phase === 'question');

  if (phase === 'finished') {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <Leaderboard
          scores={scores}
          myId={myPeerId}
          totalQuestions={33}
          questions={allQuestions}
          myAnswers={myAnswers}
          onClose={() => window.location.reload()}
        />
      </div>
    );
  }

  if (phase === 'lobby') {
    return <ClientWaitingScreen name={playerName} roomCode={client.roomState?.roomCode ?? ''} />;
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <QuestionCard
        question={currentQuestion}
        questionIndex={questionIndex}
        totalQuestions={33}
        myAnswer={myAnswer}
        revealLetter={revealLetter}
        onAnswer={sendAnswer}
        answeredCount={answeredCount}
        totalPlayers={totalPlayers}
        secondsLeft={secondsLeft}
        secondsTotal={timeLimit}
        phase={phase}
      />
    </div>
  );
}

// ─── ROOT MULTIPLAYER SCREEN ──────────────────────────────────────────────────

export type MultiplayerRole = 'choose' | 'host' | 'client';

interface MultiplayerScreenProps {
  catalog: { general: Question[]; states: Record<string, Question[]> };
  selectedState: BundeslandCode;
  onExit: () => void;
}

export function MultiplayerScreen({ catalog, selectedState, onExit }: MultiplayerScreenProps) {
  const [role, setRole] = useState<MultiplayerRole>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('lid_mp_name') || '');
  const [hostName, setHostName] = useState(() => localStorage.getItem('lid_mp_name') || 'Host');
  const [mode, setMode] = useState<RoomMode>('sofort');
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);

  // Questions built once per host session
  const questions = useMemo(
    () => role === 'host' ? buildExamQuestions(catalog.general, catalog.states, selectedState) : [],
    [role] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const host = useMultiplayerHost({ questions, mode, secondsPerQuestion, hostName });
  const client = useMultiplayerClient(
    role === 'client' ? joinCode : '',
    role === 'client' ? playerName : '',
  );

  // Auto-enter client from URL param
  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get('room');
    if (r) {
      setJoinCode(r.toUpperCase());
      setRole('client');
    }
  }, []);

  const handleJoin = (code: string, name: string) => {
    setJoinCode(code);
    setPlayerName(name);
    setRole('client');
  };

  // ── Choose role ──
  if (role === 'choose') {
    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader title="Mehrspielermodus" onBack={onExit} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mehrspielermodus</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Spielen Sie gemeinsam mit bis zu 30 Personen
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3 mt-2">
            <button
              onClick={() => setRole('host')}
              className="w-full p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-left cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors"
            >
              <div className="font-bold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Wifi className="w-4 h-4" /> Spiel erstellen
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Raumcode generieren und Teilnehmer einladen
              </div>
            </button>

            <button
              onClick={() => setRole('client')}
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> Spiel beitreten
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Mit Raumcode oder Link beitreten
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Client flow ──
  if (role === 'client') {
    // Not yet connected: show join form
    if (!client.connected && !client.error) {
      if (!joinCode) {
        return (
          <div className="flex-1 flex flex-col">
            <ScreenHeader title="Spiel beitreten" onBack={() => setRole('choose')} />
            <JoinScreen onJoin={handleJoin} />
          </div>
        );
      }
      // Connecting…
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader title="Verbinde…" onBack={() => setRole('choose')} />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }

    if (client.error) {
      const isHostDisconnect = client.errorKind === 'host_disconnected';
      const isRejected = client.errorKind === 'rejected';
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader
            title={isHostDisconnect ? 'Host getrennt' : isRejected ? 'Spiel läuft bereits' : 'Verbindungsfehler'}
            onBack={() => setRole('choose')}
          />
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
            <WifiOff className={`w-10 h-10 ${isRejected ? 'text-amber-500' : 'text-rose-500'}`} />
            <p className={`text-sm font-semibold ${isRejected ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {client.error}
            </p>
            {isHostDisconnect && client.scores.length > 0 && (
              <div className="mt-2 text-xs text-zinc-500">
                Letzter Stand:{' '}
                {client.scores.map((s, i) => `${i + 1}. ${s.name} (${s.score})`).join(' · ')}
              </div>
            )}
            <button onClick={() => setRole('choose')}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold cursor-pointer">
              Zurück
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader
          title={`Raum: ${joinCode}`}
          subtitle={`${client.answeredCount} / ${client.totalPlayers} geantwortet`}
          onBack={() => setRole('choose')}
        />
        <ClientGameView client={client} playerName={playerName} />
      </div>
    );
  }

  // ── Host flow ──
  if (role === 'host') {
    if (host.error) {
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader title="Verbindungsfehler" onBack={onExit} />
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
            <WifiOff className="w-10 h-10 text-rose-500" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{host.error}</p>
          </div>
        </div>
      );
    }

    if (!gameStarted) {
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader title="Spielleiter" onBack={onExit} />
          <HostLobbyScreen
            roomCode={host.roomCode || '…'}
            players={host.playerList.map((p) => ({ id: p.id, name: p.name, score: p.score }))}
            onStart={() => { setGameStarted(true); host.startGame(); }}
            mode={mode} setMode={setMode}
            secondsPerQuestion={secondsPerQuestion}
            setSecondsPerQuestion={setSecondsPerQuestion}
            hostName={hostName}
            setHostName={(name) => {
              setHostName(name);
              localStorage.setItem('lid_mp_name', name);
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader
          title={`Raum: ${host.roomCode}`}
          subtitle={`${host.answeredCount} / ${host.totalPlayers} geantwortet`}
          onBack={onExit}
        />
        <HostGameView host={host} questions={questions} mode={mode} secondsPerQuestion={secondsPerQuestion} />
      </div>
    );
  }

  return null;
}

// ─── SHARED HEADER ────────────────────────────────────────────────────────────

function ScreenHeader({ title, subtitle, onBack }: {
  title: string; subtitle?: string; onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">{title}</div>
          {subtitle && <div className="text-xs text-zinc-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
