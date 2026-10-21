import React, { useEffect, useState } from 'react';
import Avatar from 'boring-avatars';
import { Award, Check, ChevronRight, Clock, HelpCircle, Trophy, Users, X, XCircle } from 'lucide-react';
import { Question } from '../types';
import { RoomMode, RoomPhase } from './types';
import { resolveQuestionImageSrc } from '../data/questionsData';
import { getBackupImageUrl } from '../data/bundeslaender';

// Splits "Question text? © Author/Source" into question + copyright credit
const splitCopyright = (text: string): { text: string; credit: string | null } => {
  const raw = text || '';
  const idx = raw.indexOf('©');
  if (idx === -1) return { text: raw.trim(), credit: null };
  return {
    text: raw.slice(0, idx).trim(),
    credit: raw.slice(idx).trim()
  };
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────

export function PlayerAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <Avatar
      size={size}
      name={name}
      variant="beam"
      colors={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']}
    />
  );
}

// ─── COUNTDOWN RING ───────────────────────────────────────────────────────────

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, seconds / total);
  const dash = circ * pct;
  const color = pct > 0.4 ? '#3b82f6' : pct > 0.2 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor"
        className="text-zinc-200 dark:text-zinc-800" strokeWidth={4} />
      <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 1s linear' }}
      />
      <text x={28} y={33} textAnchor="middle" fontSize={13} fontWeight="bold"
        fill={color}>
        {seconds}
      </text>
    </svg>
  );
}

// ─── ANSWER BUTTON ────────────────────────────────────────────────────────────

function AnswerButton({
  letter, text, selected, correct, wrong, disabled, onClick
}: {
  letter: 'a' | 'b' | 'c' | 'd';
  text: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  let cls = 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400';
  let keyCls = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';

  if (correct) {
    cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500';
    keyCls = 'bg-emerald-500 text-white';
  } else if (wrong) {
    cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-100 line-through opacity-70';
    keyCls = 'bg-rose-500 text-white';
  } else if (selected) {
    cls = 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white ring-1 ring-zinc-900 dark:ring-white font-medium';
    keyCls = 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[48px] p-3 rounded-xl border text-left transition-all flex items-start gap-3 disabled:cursor-default cursor-pointer active:scale-[0.99] ${cls}`}
    >
      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${keyCls}`}>
        {letter}
      </span>
      <span className="text-sm leading-relaxed flex-1 pt-0.5">{text}</span>
    </button>
  );
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  myAnswer: 'a' | 'b' | 'c' | 'd' | null;
  revealLetter: 'a' | 'b' | 'c' | 'd' | null;
  onAnswer: (letter: 'a' | 'b' | 'c' | 'd') => void;
  answeredCount: number;
  totalPlayers: number;
  secondsLeft: number;
  secondsTotal: number;
  isHost?: boolean;
  onHostNext?: () => void;
  phase: RoomPhase;
}

export function QuestionCard({
  question, questionIndex, totalQuestions,
  myAnswer, revealLetter, onAnswer,
  answeredCount, totalPlayers,
  secondsLeft, secondsTotal,
  isHost, onHostNext, phase,
}: QuestionCardProps) {
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [activeImgSrc, setActiveImgSrc] = useState<string | null>(() => resolveQuestionImageSrc(question.image));
  useEffect(() => {
    setActiveImgSrc(resolveQuestionImageSrc(question.image));
  }, [question.image]);

  const hasAnswered = myAnswer !== null;
  const isRevealing = phase === 'reveal';
  const parsed = splitCopyright(question.question);

  return (
    <div className="space-y-3 w-full max-w-lg mx-auto">
      {/* Progress + timer */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-zinc-500">
          Frage {questionIndex + 1} / {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {answeredCount} / {totalPlayers}
          </span>
          {phase === 'question' && <CountdownRing seconds={secondsLeft} total={secondsTotal} />}
          {isRevealing && (
            <span className="text-xs font-semibold text-zinc-400 animate-pulse">
              Nächste Frage…
            </span>
          )}
        </div>
      </div>

      {/* Question text & optional Image */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        {activeImgSrc && (
          <div className="text-center">
            <img
              src={activeImgSrc}
              alt="Abbildung zur Frage"
              onClick={() => setZoomedImg(activeImgSrc)}
              onError={() => {
                const backup = question.imageBackup || getBackupImageUrl(question.image);
                if (backup && backup !== activeImgSrc) {
                  setActiveImgSrc(backup);
                }
              }}
              className="max-h-52 max-w-full mx-auto object-contain rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white p-2 cursor-zoom-in"
            />
            {parsed.credit && (
              <p className="mt-1.5 text-[10px] leading-tight text-zinc-400 dark:text-zinc-500 text-center">
                {parsed.credit}
              </p>
            )}
          </div>
        )}
        {!activeImgSrc && parsed.credit && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{parsed.credit}</p>
        )}
        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white leading-snug">
          {parsed.text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(['a', 'b', 'c', 'd'] as const).map((letter) => {
          const text = question[letter];
          if (!text) return null;
          const isSelected = myAnswer === letter;
          const isCorrect = isRevealing && letter === revealLetter;
          const isWrong = isRevealing && isSelected && letter !== revealLetter;
          return (
            <AnswerButton
              key={letter}
              letter={letter}
              text={text}
              selected={isSelected && !isRevealing}
              correct={isCorrect}
              wrong={isWrong}
              disabled={hasAnswered || isRevealing || phase !== 'question' || secondsLeft <= 0}
              onClick={() => onAnswer(letter)}
            />
          );
        })}
      </div>

      {/* Status bar */}
      <div className="text-center text-xs text-zinc-500 pt-1">
        {hasAnswered && !isRevealing && (
          <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> Antwort gespeichert
          </span>
        )}
      </div>

      {/* Host controls */}
      {isHost && (phase === 'question' || phase === 'reveal') && (
        <button
          onClick={onHostNext}
          className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          {phase === 'question' ? 'Frage überspringen' : 'Nächste Frage'}
        </button>
      )}

      {/* Image Zoom Modal */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setZoomedImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedImg}
              alt="Vergrößerte Abbildung"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl bg-white p-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomedImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:bg-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD & DETAILED RESULTS ──────────────────────────────────────────

export function Leaderboard({
  scores, myId, totalQuestions, questions, myAnswers, onClose,
}: {
  scores: { id: string; name: string; score: number }[];
  myId?: string;
  totalQuestions: number;
  questions?: Question[];
  myAnswers?: Record<number, 'a' | 'b' | 'c' | 'd' | null>;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'wrong'>('all');
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  // Standard competition ranking (1, 1, 3, 4 etc. - tied players share same rank/medal)
  let currentRank = 1;
  const rankedScores = scores.map((p, idx, arr) => {
    if (idx > 0 && p.score < arr[idx - 1].score) {
      currentRank = idx + 1;
    }
    return { ...p, rank: currentRank };
  });

  const myPlayer = rankedScores.find((p) => p.id === myId);
  const myScore = myPlayer ? myPlayer.score : 0;

  // Breakdown across general vs regional questions
  const stats = React.useMemo(() => {
    if (!questions || questions.length === 0) return null;
    let generalCorrect = 0;
    let generalTotal = 0;
    let regionalCorrect = 0;
    let regionalTotal = 0;
    const items: {
      q: Question;
      index: number;
      userChoice: 'a' | 'b' | 'c' | 'd' | null;
      isCorrect: boolean;
    }[] = [];

    questions.forEach((q, idx) => {
      if (!q) return;
      const isRegional = q.num.includes('-');
      if (isRegional) regionalTotal++;
      else generalTotal++;

      const userChoice = myAnswers ? myAnswers[idx] ?? null : null;
      const isCorrect = userChoice === q.solution;
      if (isCorrect) {
        if (isRegional) regionalCorrect++;
        else generalCorrect++;
      }
      items.push({ q, index: idx, userChoice, isCorrect });
    });

    return {
      generalCorrect,
      generalTotal,
      regionalCorrect,
      regionalTotal,
      wrongCount: items.filter((it) => !it.isCorrect).length,
      items,
    };
  }, [questions, myAnswers]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 animate-in fade-in duration-300 pb-8">
      {/* 1. Leaderboard Ranking */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="text-center pb-4">
          <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-500 animate-bounce" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Rangliste</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Ergebnis aller Teilnehmer</p>
        </div>

        <div className="space-y-2">
          {rankedScores.map((p) => {
            const isMe = p.id === myId;
            const medal = medals[p.rank];
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe
                  ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50'
                  }`}
              >
                <span className="w-7 text-center text-base font-bold">
                  {medal || <span className="text-xs text-zinc-400">#{p.rank}</span>}
                </span>
                <PlayerAvatar name={p.name} size={32} />
                <span className="flex-1 font-semibold text-sm text-zinc-900 dark:text-white truncate">
                  {p.name} {isMe && <span className="text-blue-500 text-xs font-bold ml-1">(Sie)</span>}
                </span>
                <span className="font-mono font-bold text-sm text-zinc-700 dark:text-zinc-300">
                  {p.score} / {totalQuestions}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Personal Exam Assessment Grade */}
      {myPlayer && (
        <div className={`p-4 rounded-2xl border text-center shadow-xs space-y-2 ${myScore >= 17
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : myScore >= 15
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}>
          <div className="flex items-center justify-center gap-1.5 font-bold text-base">
            {myScore >= 15 ? <Award className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>
              {myScore >= 17
                ? 'BESTANDEN! (Einbürgerung 🎉)'
                : myScore >= 15
                  ? 'BESTANDEN! (Integrationskurs)'
                  : 'NICHT BESTANDEN'}
            </span>
          </div>
          <p className="text-xs opacity-90 max-w-sm mx-auto leading-relaxed">
            {myScore >= 17
              ? 'Herzlichen Glückwunsch! Sie haben mindestens 17 Punkte erreicht und damit die Einbürgerungsvoraussetzung erfüllt.'
              : myScore >= 15
                ? 'Sie haben das Niveau des Integrationskurses erreicht (mindestens 15 Punkte). Für die Einbürgerung sind 17 Punkte erforderlich.'
                : 'Für das Bestehen sind mindestens 15 richtige Antworten von 33 erforderlich.'}
          </p>

          {/* 3 Stats Chips */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-current/10">
              <div className="text-[10px] opacity-75">Ihre Punkte</div>
              <div className="text-base font-bold font-mono">{myScore} / {totalQuestions}</div>
              <div className="text-[10px] opacity-75">{Math.round((myScore / totalQuestions) * 100)}%</div>
            </div>
            <div className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-current/10">
              <div className="text-[10px] opacity-75">Bundesfragen</div>
              <div className="text-base font-bold font-mono">
                {stats ? `${stats.generalCorrect} / ${stats.generalTotal}` : '—'}
              </div>
              <div className="text-[10px] opacity-75">Allgemein</div>
            </div>
            <div className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-current/10">
              <div className="text-[10px] opacity-75">Landesfragen</div>
              <div className="text-base font-bold font-mono">
                {stats ? `${stats.regionalCorrect} / ${stats.regionalTotal}` : '—'}
              </div>
              <div className="text-[10px] opacity-75">Bundesland</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Question Breakdown */}
      {stats && stats.items.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              Detaillierte Fragenauswertung
            </span>
            <div className="flex gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${filter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Alle ({stats.items.length})
              </button>
              <button
                onClick={() => setFilter('wrong')}
                className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${filter === 'wrong'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
              >
                Nur Fehler ({stats.wrongCount})
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {stats.items
              .filter((it) => filter === 'all' || !it.isCorrect)
              .map((it) => {
                const parsed = splitCopyright(it.q.question);
                return (
                  <div
                    key={it.q.num || it.index}
                    className={`p-3.5 rounded-xl border bg-white dark:bg-zinc-900 ${it.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-800/80'
                      : 'border-rose-300 dark:border-rose-800/80'
                      }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-zinc-400">
                        Frage {it.index + 1} (Katalog: {it.q.num})
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${it.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                        {it.isCorrect ? 'Richtig' : it.userChoice ? `Ihre Wahl: ${it.userChoice.toUpperCase()}` : 'Keine Antwort'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white mb-2 leading-snug">
                      {parsed.text}
                    </p>

                    <div className="space-y-1">
                      {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                        const optText = it.q[letter];
                        if (!optText) return null;
                        const isChosen = it.userChoice === letter;
                        const isSolution = it.q.solution === letter;

                        let optCls = 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/30';
                        if (isSolution) {
                          optCls = 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-medium';
                        } else if (isChosen && !isSolution) {
                          optCls = 'border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-medium';
                        }

                        return (
                          <div
                            key={letter}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-start gap-2 ${optCls}`}
                          >
                            <span className="font-bold uppercase text-[10px] w-4 text-center mt-0.5">
                              {letter}
                            </span>
                            <span className="flex-1 leading-snug">{optText}</span>
                            {isSolution && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />}
                            {isChosen && !isSolution && <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. Close Action */}
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm cursor-pointer active:scale-95 transition-transform mt-2"
      >
        Zur Übungsansicht zurückkehren
      </button>
    </div>
  );
}

// ─── PLAYER CHIP ─────────────────────────────────────────────────────────────

export function PlayerChip({ name, isHost, onRemove }: { name: string; isHost?: boolean; onRemove?: () => void }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
      isHost
        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
    }`}>
      <PlayerAvatar name={name} size={24} />
      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
        {name} {isHost && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 ml-1">Host</span>}
      </span>
      {onRemove && (
        <button onClick={onRemove} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── TIMER HOOK ───────────────────────────────────────────────────────────────

/** Countdown based on target end time (immune to background-tab throttling) */
export function useCountdown(seconds: number, key: number, running: boolean) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
    if (!running || seconds <= 0) return;

    const end = Date.now() + seconds * 1000;
    const update = () => {
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(rem);
    };

    update();
    const t = setInterval(update, 250);
    return () => clearInterval(t);
  }, [key, seconds, running]);

  return left;
}

// ─── EXIT CONFIRMATION MODAL ─────────────────────────────────────────────────

export function ExitConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Abbrechen',
  onCancel,
  alternateAction,
}: {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel: () => void;
  alternateAction?: {
    label: string;
    onClick: () => void;
  };
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mx-auto flex items-center justify-center mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>

        <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-white">
          {title}
        </h3>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
          {description}
        </div>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          >
            {confirmLabel}
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {cancelLabel}
          </button>

          {alternateAction && (
            <button
              onClick={alternateAction.onClick}
              className="w-full py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              {alternateAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

