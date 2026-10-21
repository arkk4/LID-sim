import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, ChevronRight, Clock, Copy, GraduationCap, Info, Square, Users, Wifi, WifiOff, X } from 'lucide-react';
import { Question, BundeslandCode } from '../types';
import { RoomMode } from './types';
import {
  ExitConfirmModal, Leaderboard, PlayerAvatar, PlayerChip, QuestionCard, useCountdown,
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

function JoinScreen({ onJoin, initialCode = '' }: { onJoin: (code: string, name: string) => void; initialCode?: string }) {
  const [code, setCode] = useState(() => {
    const url = new URL(window.location.href);
    return (url.searchParams.get('room') || initialCode).toUpperCase();
  });
  const [name, setName] = useState(() => localStorage.getItem('lid_mp_name') || '');
  const [err, setErr] = useState<string | null>(null);

  // Pre-fill code from URL ?room=XXXX or prop
  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get('room') || initialCode;
    if (r) setCode(r.toUpperCase());
  }, [initialCode]);

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

// ─── MODE VISUAL PREVIEW ─────────────────────────────────────────────────────

function ModeVisualPreview({ mode, compact }: { mode: RoomMode; compact?: boolean }) {
  if (mode === 'sofort') {
    return (
      <div className={`${compact ? 'mt-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60' : 'mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80'} space-y-1`}>
        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 mb-0.5 px-0.5">
          <span className="uppercase tracking-wider font-semibold">Vorschau nach Antwort</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
            Sofort aufgelöst
          </span>
        </div>
        <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'}>
          {/* Wrong answer chosen */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs min-w-0">
            <span className="w-4 h-4 rounded bg-rose-500 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
              A
            </span>
            <span className="flex-1 truncate line-through opacity-75 text-[11px]">Ihre Wahl</span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
              <X className="w-3 h-3" /> {!compact && 'Falsch'}
            </span>
          </div>
          {/* Correct answer revealed */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 text-xs ring-1 ring-emerald-500/20 min-w-0">
            <span className="w-4 h-4 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
              B
            </span>
            <span className="flex-1 truncate font-medium text-[11px]">Lösung</span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              <Check className="w-3 h-3" /> {!compact && 'Richtig'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'mt-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60' : 'mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80'} space-y-1`}>
      <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 mb-0.5 px-0.5">
        <span className="uppercase tracking-wider font-semibold">Vorschau nach Antwort</span>
        <span className="text-zinc-500 dark:text-zinc-400 font-medium text-[10px]">Keine Auflösung</span>
      </div>
      <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'}>
        {/* Selected answer - neutral exam style */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white text-xs ring-1 ring-zinc-900/20 dark:ring-white/20 font-medium min-w-0">
          <span className="w-4 h-4 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center justify-center text-[9px] shrink-0">
            A
          </span>
          <span className="flex-1 truncate text-[11px]">Ihre Wahl</span>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
            Gespeichert
          </span>
        </div>
        {/* Other unselected option */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 text-xs min-w-0">
          <span className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold flex items-center justify-center text-[9px] shrink-0">
            B
          </span>
          <span className="flex-1 truncate text-[11px]">Weitere Option…</span>
          <span className="text-[10px] opacity-0 shrink-0">—</span>
        </div>
      </div>
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

  const [copied, setCopied] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);

  const copyLink = async () => {
    let ok = false;
    // Prefer Clipboard API (Chrome, modern Safari)
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(joinUrl); ok = true; } catch { /* fall through */ }
    }
    // Fallback: textarea + execCommand (iOS Safari, older browsers)
    if (!ok) {
      try {
        const el = Object.assign(document.createElement('textarea'), {
          value: joinUrl,
          style: 'position:fixed;opacity:0;top:0;left:0',
        });
        document.body.appendChild(el);
        el.focus(); el.select();
        // eslint-disable-next-line deprecation/deprecation
        ok = document.execCommand('copy');
        document.body.removeChild(el);
      } catch { /* ignore */ }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
    {/* QR fullscreen overlay */}
    {qrExpanded && (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setQrExpanded(false)}
      >
        <div
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Raumcode scannen</p>
          <div className="text-3xl font-mono font-black tracking-[0.2em] text-zinc-900 dark:text-white">{roomCode}</div>
          <QRCodeSVG value={joinUrl} size={240} bgColor="transparent"
            fgColor="currentColor" className="text-zinc-900 dark:text-white" />
          <button
            onClick={() => setQrExpanded(false)}
            className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Schließen
          </button>
        </div>
      </div>
    )}

    <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Room code */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Raumcode</p>
        <div className="text-5xl font-mono font-black tracking-[0.2em] text-zinc-900 dark:text-white mb-3">
          {roomCode}
        </div>
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setQrExpanded(true)}
            className="cursor-zoom-in rounded-xl transition-transform hover:scale-105 active:scale-95"
            title="QR-Code vergrößern"
          >
            <QRCodeSVG value={joinUrl} size={120} bgColor="transparent"
              fgColor="currentColor" className="rounded-xl text-zinc-900 dark:text-white" />
          </button>
        </div>
        <button
          onClick={copyLink}
          // onTouchStart noop: makes iOS Safari fire :active / Tailwind active: variants
          onTouchStart={() => {}}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all active:scale-95 ${
            copied
              ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Kopiert!' : 'Link kopieren'}
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
          <ModeVisualPreview mode={mode} compact />
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
    </>
  );
}

// ─── CLIENT WAITING SCREEN ───────────────────────────────────────────────────

function ClientWaitingScreen({
  name, roomCode, players, hostSilent, mode, secondsPerQuestion,
}: {
  name: string;
  roomCode: string;
  players: { id: string; name: string }[];
  hostSilent: boolean;
  mode?: RoomMode;
  secondsPerQuestion?: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
      {hostSilent && (
        <div className="w-full max-w-xs flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <WifiOff className="w-4 h-4 shrink-0" />
          Host kurz nicht erreichbar… warte auf Wiederverbindung
        </div>
      )}
      <PlayerAvatar name={name} size={64} />
      <div>
        <p className="font-bold text-zinc-900 dark:text-white">{name}</p>
        <p className="text-xs text-zinc-500 mt-0.5">Raum: {roomCode}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        Warten auf Spielstart…
      </div>

      {mode && (
        <div className="w-full max-w-xs p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
            Gewählter Spielmodus
          </p>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-white">
            <span>
              {mode === 'sofort' ? 'Sofortige Auswertung' : 'Abschlussauswertung'}
            </span>
            {secondsPerQuestion && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500 font-normal">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {secondsPerQuestion} Sek.
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
            {mode === 'sofort'
              ? 'Antwort wird nach jeder Frage aufgedeckt.'
              : 'Ergebnis und Auswertung werden erst am Ende gezeigt.'}
          </p>
          <ModeVisualPreview mode={mode} />
        </div>
      )}

      {players.length > 0 && (
        <div className="w-full max-w-xs">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Im Raum ({players.length})
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p) => (
              <PlayerChip key={p.id} name={p.name} isHost={p.id === 'host'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOST GAME VIEW ───────────────────────────────────────────────────────────

function HostGameView({
  host, questions, mode, secondsPerQuestion, onRequestEnd, onExit,
}: {
  host: ReturnType<typeof useMultiplayerHost>;
  questions: Question[];
  mode: RoomMode;
  secondsPerQuestion: number;
  onRequestEnd: () => void;
  onExit: () => void;
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
          onClose={onExit}
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex justify-end mb-2">
        <button
          onClick={onRequestEnd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          Sitzung beenden
        </button>
      </div>
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
  client, playerName, roomCode, onExit,
}: {
  client: ReturnType<typeof useMultiplayerClient>;
  playerName: string;
  roomCode: string;
  onExit: () => void;
}) {
  const { phase, questionIndex, currentQuestion, myAnswer, revealLetter,
    answeredCount, totalPlayers, scores, timeLimit, sendAnswer, myPeerId,
    allQuestions, myAnswers, lobbyPlayers, hostSilent } = client;

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
          onClose={onExit}
        />
      </div>
    );
  }

  if (phase === 'lobby') {
    return (
      <ClientWaitingScreen
        name={playerName}
        roomCode={client.roomState?.roomCode || roomCode}
        players={lobbyPlayers}
        hostSilent={hostSilent}
        mode={client.roomState?.mode}
        secondsPerQuestion={client.roomState?.secondsPerQuestion}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {hostSilent && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-3">
          <WifiOff className="w-4 h-4 shrink-0" />
          Host kurz nicht erreichbar… warte auf Wiederverbindung
        </div>
      )}
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

  const host = useMultiplayerHost({
    questions,
    mode,
    secondsPerQuestion,
    hostName,
    enabled: role === 'host',
  });
  const client = useMultiplayerClient(
    role === 'client' ? joinCode : '',
    role === 'client' ? playerName : '',
  );

  const [isHostExitModalOpen, setIsHostExitModalOpen] = useState(false);
  const [isClientExitModalOpen, setIsClientExitModalOpen] = useState(false);

  // Auto-enter client from URL param
  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get('room');
    if (r) {
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
    // If the game has already finished, stay on the results screen even if host disconnects!
    if (client.phase === 'finished') {
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader
            title={`Raum: ${joinCode}`}
            subtitle="Spiel beendet"
            onBack={onExit}
          />
          <ClientGameView client={client} playerName={playerName} roomCode={joinCode} onExit={onExit} />
        </div>
      );
    }

    // Not yet connected: show join form
    if (!client.connected && !client.error) {
      if (!joinCode || !playerName) {
        return (
          <div className="flex-1 flex flex-col">
            <ScreenHeader title="Spiel beitreten" onBack={() => { setJoinCode(''); setRole('choose'); }} />
            <JoinScreen onJoin={handleJoin} />
          </div>
        );
      }
      // Connecting…
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader title="Verbinde…" onBack={() => { setJoinCode(''); setRole('choose'); }} />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }

    if (client.error) {
      const isHostDisconnect = client.errorKind === 'host_disconnected';
      const isRejected = client.errorKind === 'rejected';
      const isBlocked = client.errorKind === 'webrtc_blocked';
      const isTimeout = client.errorKind === 'timeout';
      const isNotFound = client.errorKind === 'peer_unavailable';

      const errorTitle = isHostDisconnect
        ? 'Host getrennt'
        : isRejected
        ? 'Spiel läuft bereits'
        : isBlocked
        ? 'Netzwerk blockiert Verbindung'
        : isTimeout
        ? 'Zeitüberschreitung'
        : isNotFound
        ? 'Raum nicht gefunden'
        : 'Verbindungsfehler';

      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader
            title={errorTitle}
            onBack={() => { setJoinCode(''); setRole('choose'); }}
          />
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
            <WifiOff className={`w-10 h-10 ${isRejected ? 'text-amber-500' : 'text-rose-500'}`} />
            <p className={`text-sm font-semibold ${isRejected ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {client.error}
            </p>
            {client.errorTip && (
              <div className="w-full max-w-sm p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-left flex gap-3 text-xs text-blue-900 dark:text-blue-200">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{client.errorTip}</span>
              </div>
            )}
            {isHostDisconnect && client.scores.length > 0 && (
              <div className="mt-2 text-xs text-zinc-500">
                Letzter Stand:{' '}
                {client.scores.map((s, i) => `${i + 1}. ${s.name} (${s.score})`).join(' · ')}
              </div>
            )}
            <div className="flex items-center gap-2">
              {!isRejected && (
                <button
                  onClick={() => client.retryConnect()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-500 transition-colors"
                >
                  Erneut versuchen
                </button>
              )}
              <button
                onClick={() => { setJoinCode(''); setRole('choose'); }}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Zurück
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isClientPlaying = client.phase === 'question' || client.phase === 'reveal';

    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader
          title={`Raum: ${joinCode}`}
          subtitle={`${client.answeredCount} / ${client.totalPlayers} geantwortet`}
          onBack={() => {
            if (isClientPlaying) {
              setIsClientExitModalOpen(true);
            } else {
              setJoinCode('');
              setRole('choose');
            }
          }}
        />
        <ClientGameView client={client} playerName={playerName} roomCode={joinCode} onExit={onExit} />

        <ExitConfirmModal
          isOpen={isClientExitModalOpen}
          title="Spiel verlassen?"
          description="Möchten Sie das laufende Mehrspielerspiel wirklich verlassen und zur Übungsansicht zurückkehren?"
          confirmLabel="Im Spiel bleiben"
          onConfirm={() => setIsClientExitModalOpen(false)}
          cancelLabel="Spiel verlassen"
          onCancel={() => {
            setIsClientExitModalOpen(false);
            onExit();
          }}
        />
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
            <div className="w-full max-w-sm p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-left flex gap-3 text-xs text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Tipp: Wenn du die App zum Teilen des Links verlassen hast, halte sie im Vordergrund. Du kannst versuchen, die Verbindung wiederherzustellen, ohne den Raum neu erstellen zu müssen.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => host.reconnectHost()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-500 transition-colors"
              >
                Verbindung wiederherstellen
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Beenden
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!gameStarted) {
      return (
        <div className="flex-1 flex flex-col">
          <ScreenHeader title="Spielleiter" onBack={() => setRole('choose')} />
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

    const isHostPlaying = host.phase === 'question' || host.phase === 'reveal';

    return (
      <div className="flex-1 flex flex-col">
        <ScreenHeader
          title={`Raum: ${host.roomCode}`}
          subtitle={`${host.answeredCount} / ${host.totalPlayers} geantwortet`}
          onBack={() => {
            if (isHostPlaying) {
              setIsHostExitModalOpen(true);
            } else {
              onExit();
            }
          }}
        />
        <HostGameView
          host={host}
          questions={questions}
          mode={mode}
          secondsPerQuestion={secondsPerQuestion}
          onRequestEnd={() => setIsHostExitModalOpen(true)}
          onExit={onExit}
        />

        <ExitConfirmModal
          isOpen={isHostExitModalOpen}
          title="Sitzung beenden?"
          description="Möchten Sie die Sitzung jetzt beenden und das Endergebnis für alle anzeigen, weiterspielen oder den Raum verlassen?"
          confirmLabel="Sitzung beenden & Ergebnis anzeigen"
          onConfirm={() => {
            setIsHostExitModalOpen(false);
            host.hostEndEarly();
          }}
          cancelLabel="Weiterspielen"
          onCancel={() => setIsHostExitModalOpen(false)}
          alternateAction={{
            label: 'Raum schließen & zum Üben zurückkehren',
            onClick: () => {
              setIsHostExitModalOpen(false);
              onExit();
            },
          }}
        />
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
