import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, Moon, GraduationCap, ChevronLeft, ChevronRight, 
  X, RotateCcw, Check, Award, XCircle, MapPin, 
  ListFilter, Search, ArrowRight, Clock, HelpCircle, Layers,
  Menu, Settings
} from 'lucide-react';
import { BundeslandCode, Question, QuestionSet, ThemeMode } from './types';
import { BUNDESLAENDER, STATE_COAT_FALLBACKS } from './data/bundeslaender';
import { PRESET_QUESTION_SETS } from './data/presetSets';
import { 
  BUILTIN_GENERAL_QUESTIONS, 
  BUILTIN_STATE_QUESTIONS, 
  resolveQuestionImageSrc 
} from './data/questionsData';
import { APP_VERSION_CONFIG } from './version';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('lid_theme') as ThemeMode) || 'dark';
  });

  // Selected Federal State
  const [selectedState, setSelectedState] = useState<BundeslandCode>(() => {
    return (localStorage.getItem('lid_selected_state') as BundeslandCode) || 'NW';
  });

  // Database of Questions
  const [catalog, setCatalog] = useState<{
    general: Question[];
    states: Record<string, Question[]>;
  }>({
    general: BUILTIN_GENERAL_QUESTIONS,
    states: BUILTIN_STATE_QUESTIONS
  });

  // Available Question Sets (from sets.json or presets)
  const [availableSets, setAvailableSets] = useState<QuestionSet[]>(PRESET_QUESTION_SETS);
  const [activeSet, setActiveSet] = useState<QuestionSet | null>(null);

  // Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);

  // Practice Mode Answer: In practice mode, answer is ephemeral!
  // Moving back or next resets the answer so students can test themselves repeatedly.
  const [currentAnswer, setCurrentAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);

  // Unified Navigator & Sets Bottom Sheet Modal
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [navigatorTab, setNavigatorTab] = useState<'questions' | 'sets'>('questions');
  const [jumpQuery, setJumpQuery] = useState('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [pageJumpQuery, setPageJumpQuery] = useState('');
  const [pageJumpError, setPageJumpError] = useState<string | null>(null);

  // Quick Jump Input in top header (question / page jump)
  const [quickJumpInput, setQuickJumpInput] = useState('');
  const [quickJumpError, setQuickJumpError] = useState<string | null>(null);

  // Sidebar Menu Modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Bundesland Modal
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);

  // Image Zoom Modal
  const [zoomedImageSrc, setZoomedImageSrc] = useState<string | null>(null);

  // Exam Mode State
  const [isExamMode, setIsExamMode] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd' | null>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(60 * 60);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [isExamExitPromptOpen, setIsExamExitPromptOpen] = useState(false);
  const [filterExamReview, setFilterExamReview] = useState<'all' | 'wrong'>('all');

  // Apply Theme to DOM
  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      const root = document.documentElement;
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('lid_theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Load questions.json & sets.json from repository if present
  useEffect(() => {
    async function loadData() {
      // 1. Load questions.json
      try {
        const res = await fetch('questions.json');
        if (res.ok) {
          const data = await res.json();
          let general: Question[] = [];
          let states: Record<string, Question[]> = {};

          if (Array.isArray(data)) {
            general = data.filter((q: any) => /^\d+$/.test(String(q.num || '').trim()));
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.general)) general = data.general;
            if (data.states && typeof data.states === 'object') {
              states = data.states;
            } else {
              Object.keys(data).forEach((k) => {
                if (k !== 'general' && Array.isArray(data[k])) {
                  states[k.toUpperCase()] = data[k];
                }
              });
            }
          }

          if (general.length > 0) {
            general.sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10));
            setCatalog({
              general,
              states: Object.keys(states).length > 0 ? states : BUILTIN_STATE_QUESTIONS
            });
          }
        }
      } catch {
        // Built-in catalog fallback ready
      }

      // 2. Load sets.json from repository if present
      try {
        const setsRes = await fetch('sets.json');
        if (setsRes.ok) {
          const setsData = await setsRes.json();
          if (Array.isArray(setsData) && setsData.length > 0) {
            const formatted: QuestionSet[] = setsData.map((s: any, idx: number) => ({
              id: s.id || `repo-set-${idx}`,
              title: s.title || `Set ${idx + 1}`,
              description: s.description || '',
              subtitle: s.subtitle || `${(s.questions || []).length} Fragen`,
              questionNumbers: (s.questions || s.nums || []).map((n: any) => String(n).trim())
            }));
            setAvailableSets(formatted);
          }
        }
      } catch {
        // Fall back to preset sets
      }
    }

    loadData();
  }, []);

  // Combine Active Pool of Questions for the selected Bundesland
  const allCurrentQuestions = useMemo(() => {
    const general = catalog.general;
    const stateKey = selectedState.toUpperCase();
    const stateList = catalog.states[stateKey] || BUILTIN_STATE_QUESTIONS[selectedState] || [];

    const sortedState = [...stateList].sort((a, b) => {
      const getSubNum = (item: Question) => {
        const parts = String(item.num || '').split('-');
        return parts.length > 1 ? parseInt(parts[1], 10) : (parseInt(item.num, 10) || 0);
      };
      return getSubNum(a) - getSubNum(b);
    });

    return [...general, ...sortedState];
  }, [catalog, selectedState]);

  // Questions displayed in Practice mode (Full pool or Filtered by Active Set)
  const displayedQuestions = useMemo(() => {
    if (!activeSet) return allCurrentQuestions;

    const setNums = activeSet.questionNumbers;
    const result: Question[] = [];
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    setNums.forEach((numStr) => {
      const targetClean = clean(numStr);
      const found = allCurrentQuestions.find((q) => clean(q.num) === targetClean);
      if (found) {
        result.push(found);
      } else if (/^\d+$/.test(numStr)) {
        const idx = parseInt(numStr, 10) - 1;
        if (allCurrentQuestions[idx]) {
          result.push(allCurrentQuestions[idx]);
        }
      }
    });

    return result.length > 0 ? result : allCurrentQuestions;
  }, [allCurrentQuestions, activeSet]);

  const currentQuestion = displayedQuestions[currentIndex] || displayedQuestions[0];

  // Exam Countdown Timer
  useEffect(() => {
    if (!isExamMode || isExamSubmitted) return;

    const timer = setInterval(() => {
      setExamTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExamSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamMode, isExamSubmitted]);

  // Handle Practice Answer Click
  const handlePracticeAnswer = (opt: 'a' | 'b' | 'c' | 'd') => {
    if (currentAnswer !== null) return;
    setCurrentAnswer(opt);
  };

  // Navigation: Going Prev or Next resets currentAnswer (Requirement 5)
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCurrentAnswer(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentIndex < displayedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentAnswer(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Jump from Navigator Sheet (font-size 16px prevents iOS auto-zoom)
  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJumpError(null);
    const raw = jumpQuery.trim();
    if (!raw) return;

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchClean = clean(raw);

    let targetIdx = displayedQuestions.findIndex((q) => clean(q.num) === searchClean);

    if (targetIdx === -1 && /^\d+$/.test(raw)) {
      const numVal = parseInt(raw, 10);
      if (numVal >= 1 && numVal <= displayedQuestions.length) {
        targetIdx = numVal - 1;
      }
    }

    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
      setCurrentAnswer(null);
      setJumpQuery('');
      setIsNavigatorOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setJumpError(`Frage "${raw}" im aktuellen Set nicht gefunden.`);
    }
  };

  // Quick Jump from Top Header (Question number or page like p14 / S.14)
  const handleQuickJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickJumpError(null);
    const raw = quickJumpInput.trim();
    if (!raw) return;

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const searchClean = clean(raw);

    // 1. Try matching page number if prefixed with p/s or if user entered "p14", "s14", "seite 14"
    const pageMatch = raw.match(/^(?:p|s|seite)\.?\s*(\d+)$/i);
    if (pageMatch) {
      const pageNum = parseInt(pageMatch[1], 10);
      const matchedSet = availableSets.find((s) => {
        const idMatch = s.id.match(new RegExp(`(?:book-p|lernseite-p)${pageNum}(?:$|-)`));
        if (idMatch) return true;
        const titleMatch = s.title.match(new RegExp(`S\\.?\\s*${pageNum}(?:$|\\D)`));
        if (titleMatch) return true;
        const descMatch = (s.description || '').match(new RegExp(`S\\.?\\s*${pageNum}(?:$|\\D)`));
        return !!descMatch;
      });

      if (matchedSet) {
        handleSelectSet(matchedSet);
        setQuickJumpInput('');
        setQuickJumpError(null);
        return;
      }
    }

    // 2. Try direct question match in currently displayed set
    let targetIdx = displayedQuestions.findIndex((q) => clean(q.num) === searchClean);

    if (targetIdx === -1 && /^\d+$/.test(raw)) {
      const numVal = parseInt(raw, 10);
      // First try matching q.num == numVal (e.g. question number 42)
      targetIdx = displayedQuestions.findIndex((q) => clean(q.num) === String(numVal));
      if (targetIdx === -1 && numVal >= 1 && numVal <= displayedQuestions.length) {
        targetIdx = numVal - 1;
      }
    }

    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
      setCurrentAnswer(null);
      setQuickJumpInput('');
      setQuickJumpError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. If in activeSet and not found, check if question exists in general/state catalog
    const allQuestions = [...catalog.general, ...(catalog.states[selectedState.toUpperCase()] || [])];
    const inCatalog = allQuestions.find((q) => clean(q.num) === searchClean || clean(q.num) === clean(raw));
    if (inCatalog && activeSet !== null) {
      // Switch to complete catalog and jump to that question
      setActiveSet(null);
      const newIdx = allQuestions.findIndex((q) => clean(q.num) === clean(inCatalog.num));
      if (newIdx !== -1) {
        setCurrentIndex(newIdx);
        setCurrentAnswer(null);
        setQuickJumpInput('');
        setQuickJumpError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // 4. Try matching as set/page number if pure number
    if (/^\d+$/.test(raw)) {
      const pageNum = parseInt(raw, 10);
      const matchedSet = availableSets.find((s) => {
        const idMatch = s.id.match(new RegExp(`(?:book-p|lernseite-p)${pageNum}(?:$|-)`));
        if (idMatch) return true;
        const titleMatch = s.title.match(new RegExp(`S\\.?\\s*${pageNum}(?:$|\\D)`));
        return !!titleMatch;
      });
      if (matchedSet) {
        handleSelectSet(matchedSet);
        setQuickJumpInput('');
        setQuickJumpError(null);
        return;
      }
    }

    setQuickJumpError(`"${raw}" не знайдено`);
    setTimeout(() => setQuickJumpError(null), 3000);
  };

  // Jump to Set by page number
  const handleSetJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageJumpError(null);
    const raw = pageJumpQuery.trim();
    if (!raw) return;

    const pageNum = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(pageNum)) {
      setPageJumpError(`Bitte eine gültige Seitenzahl eingeben.`);
      return;
    }

    // Match set by page number:
    // 1. Explicit ID matches like book-p14 or lernseite-p14
    // 2. Title matching "S.14" or "S. 14"
    // 3. Description matching "S.14"
    const matched = availableSets.find((s) => {
      const idMatch = s.id.match(new RegExp(`(?:book-p|lernseite-p)${pageNum}(?:$|-)`));
      if (idMatch) return true;
      const titleMatch = s.title.match(new RegExp(`S\\.?\\s*${pageNum}(?:$|\\D)`));
      if (titleMatch) return true;
      const descMatch = (s.description || '').match(new RegExp(`S\\.?\\s*${pageNum}(?:$|\\D)`));
      if (descMatch) return true;
      return false;
    });

    if (matched) {
      handleSelectSet(matched);
      setPageJumpQuery('');
      setPageJumpError(null);
    } else {
      setPageJumpError(`Kein Fragenset für Seite ${pageNum} gefunden.`);
    }
  };

  // Select Question directly from Navigator Grid
  const handleSelectQuestionIndex = (idx: number) => {
    setCurrentIndex(idx);
    setCurrentAnswer(null);
    setIsNavigatorOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State selection
  const handleSelectState = (code: BundeslandCode) => {
    setSelectedState(code);
    localStorage.setItem('lid_selected_state', code);
    setCurrentIndex(0);
    setCurrentAnswer(null);
    setIsStateModalOpen(false);
  };

  // Set selection
  const handleSelectSet = (set: QuestionSet | null) => {
    setActiveSet(set);
    setCurrentIndex(0);
    setCurrentAnswer(null);
    setIsNavigatorOpen(false);
  };

  // Start Exam (30 general questions + 3 state questions)
  const handleStartExam = () => {
    const generalPool = [...catalog.general];
    const stateKey = selectedState.toUpperCase();
    const regionalPool = [
      ...(catalog.states[stateKey] || BUILTIN_STATE_QUESTIONS[selectedState] || [])
    ];

    const shuffle = <T,>(arr: T[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const sampledGeneral = shuffle(generalPool).slice(0, 30);
    const sampledRegional = shuffle(regionalPool).slice(0, 3);
    const examList = [...sampledGeneral, ...sampledRegional];

    setExamQuestions(examList);
    setExamAnswers({});
    setCurrentIndex(0);
    setExamTimeRemaining(60 * 60);
    setIsExamSubmitted(false);
    setIsExamExitPromptOpen(false);
    setIsExamMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Early Exit or Finish Exam with full results computation
  const handleFinishExamAndShowResults = () => {
    setIsExamSubmitted(true);
    setIsExamExitPromptOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardExam = () => {
    setIsExamMode(false);
    setIsExamSubmitted(false);
    setIsExamExitPromptOpen(false);
    setCurrentIndex(0);
    setCurrentAnswer(null);
  };

  // Exam Score Computation
  const examScore = useMemo(() => {
    if (!isExamSubmitted) return { total: 0, correct: 0, generalCorrect: 0, regionalCorrect: 0, wrongList: [] as Question[] };
    let correct = 0;
    let generalCorrect = 0;
    let regionalCorrect = 0;
    const wrongList: Question[] = [];

    examQuestions.forEach((q) => {
      const isRegional = q.num.includes('-');
      const userChoice = examAnswers[q.num];
      if (userChoice === q.solution) {
        correct++;
        if (isRegional) regionalCorrect++;
        else generalCorrect++;
      } else {
        wrongList.push(q);
      }
    });

    return { total: examQuestions.length, correct, generalCorrect, regionalCorrect, wrongList };
  }, [isExamSubmitted, examQuestions, examAnswers]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (isMenuOpen || isStateModalOpen || isNavigatorOpen || isExamExitPromptOpen) return;

      if (e.key === 'ArrowLeft') {
        if (!isExamMode) handlePrev();
        else if (currentIndex > 0) setCurrentIndex((p) => p - 1);
      } else if (e.key === 'ArrowRight') {
        if (!isExamMode) handleNext();
        else if (currentIndex < examQuestions.length - 1) setCurrentIndex((p) => p + 1);
      } else if (['1', '2', '3', '4'].includes(e.key) && !isExamMode) {
        const map: Record<string, 'a' | 'b' | 'c' | 'd'> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
        if (currentAnswer === null) handlePracticeAnswer(map[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isExamMode, currentAnswer, displayedQuestions.length, examQuestions.length, isMenuOpen, isStateModalOpen, isNavigatorOpen, isExamExitPromptOpen]);

  // Format time MM:SS
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        {/* Active Set Sub-header banner if a question set is chosen */}
        {activeSet && !isExamMode && (
          <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1 flex items-center justify-between text-xs text-zinc-800 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold truncate">Set: {activeSet.title}</span>
              <span className="text-zinc-400">·</span>
              <span>{displayedQuestions.length} Fragen</span>
            </div>
            <button
              onClick={() => handleSelectSet(null)}
              className="ml-2 font-medium underline hover:text-zinc-950 dark:hover:text-white cursor-pointer flex-shrink-0"
            >
              Alle Fragen anzeigen
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* Left: Sidebar Menu Button (Replacing state indicator button) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            disabled={isExamMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            title="Menü & Einstellungen öffnen"
          >
            <Menu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <img
              src={`Assets/coats/${selectedState}.png`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = STATE_COAT_FALLBACKS[selectedState] || '';
              }}
              alt={selectedState}
              className="w-4 h-4 object-contain flex-shrink-0"
            />
            <span className="font-bold text-xs tracking-wider text-zinc-900 dark:text-zinc-100 hidden xs:inline sm:inline">
              {selectedState}
            </span>
          </button>

          {/* Center Counter (Non-clickable, clean) */}
          {!isExamMode ? (
            <div 
              className="flex-1 text-center font-bold text-sm tracking-tight text-zinc-800 dark:text-zinc-200 truncate select-none px-1"
              title="Aktuelle Frage / Gesamtzahl"
            >
              {activeSet
                ? `${currentIndex + 1} / ${displayedQuestions.length}`
                : currentQuestion?.num.includes('-')
                ? `${currentQuestion.num} (${currentIndex + 1}/${displayedQuestions.length})`
                : `${currentQuestion?.num || currentIndex + 1} / ${displayedQuestions.length}`}
            </div>
          ) : (
            <div className="flex-1 text-center font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 px-1 truncate">
              {isExamSubmitted ? 'Prüfungsergebnis' : `Frage ${currentIndex + 1} / 33`}
            </div>
          )}

          {/* Right: Quick Jump Input in practice mode (where theme toggle used to be), or Exam controls in exam mode */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isExamMode ? (
              <form onSubmit={handleQuickJumpSubmit} className="flex items-center gap-1 relative">
                <input
                  type="text"
                  value={quickJumpInput}
                  onChange={(e) => {
                    setQuickJumpInput(e.target.value);
                    if (quickJumpError) setQuickJumpError(null);
                  }}
                  placeholder="№ / S."
                  title="Nummer (z. B. 42, NW-1) oder Seite (z. B. 14, S.14) eingeben"
                  className="w-14 sm:w-16 h-8 px-1 text-center font-mono text-base uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                />
                <button
                  type="submit"
                  className="h-8 px-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                  title="Zu Frage oder Seite springen"
                >
                  Go
                </button>
                {quickJumpError && (
                  <span className="absolute -bottom-5 right-0 whitespace-nowrap text-[10px] text-rose-500 font-semibold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded shadow-xs border border-rose-200 dark:border-rose-900/60 z-30">
                    {quickJumpError}
                  </span>
                )}
              </form>
            ) : !isExamSubmitted ? (
              <button
                onClick={() => setIsExamExitPromptOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-semibold text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Prüfung beenden oder abgeben"
              >
                Beenden
              </button>
            ) : (
              <button
                onClick={handleDiscardExam}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-semibold text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Übungsmodus
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-3 sm:p-4 flex flex-col justify-start">
        {/* ======================= EXAM MODE ======================= */}
        {isExamMode ? (
          !isExamSubmitted ? (
            /* ACTIVE EXAM SESSION */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1 rounded">
                    Offizielle Prüfungssimulation
                  </span>
                  <span className="text-xs text-zinc-500">
                    {Object.values(examAnswers).filter(Boolean).length} von 33 beantwortet
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatTimer(examTimeRemaining)}</span>
                </div>
              </div>

              {/* Exam Question Card */}
              {examQuestions[currentIndex] && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200">
                      Frage {currentIndex + 1} von 33 ({examQuestions[currentIndex].num})
                    </span>
                    <span className="text-xs text-zinc-400">
                      {examQuestions[currentIndex].num.includes('-') ? `Land: ${selectedState}` : 'Bund'}
                    </span>
                  </div>

                  {/* Optional Image */}
                  {resolveQuestionImageSrc(examQuestions[currentIndex].image) && (
                    <div className="mb-4 text-center">
                      <img
                        src={resolveQuestionImageSrc(examQuestions[currentIndex].image)!}
                        alt="Abbildung zur Frage"
                        onClick={() => setZoomedImageSrc(resolveQuestionImageSrc(examQuestions[currentIndex].image)!)}
                        className="max-h-56 max-w-full mx-auto object-contain rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white p-2 cursor-zoom-in"
                      />
                    </div>
                  )}

                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white leading-snug mb-5">
                    {examQuestions[currentIndex].question}
                  </h2>

                  {/* 4 Options */}
                  <div className="space-y-2.5">
                    {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                      const text = examQuestions[currentIndex][letter];
                      if (!text) return null;
                      const isSelected = examAnswers[examQuestions[currentIndex].num] === letter;

                      return (
                        <button
                          key={letter}
                          onClick={() => {
                            setExamAnswers((prev) => ({
                              ...prev,
                              [examQuestions[currentIndex].num]: letter
                            }));
                          }}
                          className={`w-full min-h-[48px] p-3 rounded-xl border text-left transition-all active:scale-[0.99] flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white ring-1 ring-zinc-900 dark:ring-white font-medium'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                              isSelected
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="text-sm leading-relaxed flex-1 pt-0.5">
                            {text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exam Footer Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    if (currentIndex > 0) setCurrentIndex((p) => p - 1);
                  }}
                  disabled={currentIndex === 0}
                  className="flex-1 min-h-[46px] rounded-xl border border-zinc-200 dark:border-zinc-800 font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Zurück</span>
                </button>

                {currentIndex < 32 ? (
                  <button
                    onClick={() => {
                      if (currentIndex < 32) setCurrentIndex((p) => p + 1);
                    }}
                    className="flex-1 min-h-[46px] rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <span>Weiter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsExamExitPromptOpen(true)}
                    className="flex-1 min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <Check className="w-4 h-4" />
                    <span>Prüfung abgeben</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* EXAM RESULTS BREAKDOWN */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-center shadow-xs">
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${
                    examScore.correct >= 17
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : examScore.correct >= 15
                      ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}
                >
                  {examScore.correct >= 15 ? <Award className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                </div>

                <h2 className="text-xl font-bold mb-1">
                  {examScore.correct >= 17 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      BESTANDEN! (Einbürgerungsvoraussetzung erreicht 🎉)
                    </span>
                  ) : examScore.correct >= 15 ? (
                    <span className="text-zinc-900 dark:text-zinc-100">
                      BESTANDEN! (Integrationskurs-Niveau)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">
                      NICHT BESTANDEN (Mindestens 15 Punkte erforderlich)
                    </span>
                  )}
                </h2>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  {examScore.correct >= 17
                    ? 'Herzlichen Glückwunsch! Sie haben mindestens 17 Punkte erreicht und damit die Voraussetzung für die deutsche Einbürgerung erfüllt.'
                    : examScore.correct >= 15
                    ? 'Sie haben das Niveau des Integrationskurses bestanden. Für die Einbürgerung sind mindestens 17 Punkte erforderlich.'
                    : 'Für das Bestehen des Tests sind mindestens 15 richtige Antworten von 33 erforderlich.'}
                </p>

                {/* Score Stats */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs mb-4">
                  <div>
                    <div className="text-[11px] text-zinc-500">Gesamtpunkte</div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {examScore.correct} / 33
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {Math.round((examScore.correct / 33) * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Bundesfragen</div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {examScore.generalCorrect} / 30
                    </div>
                    <div className="text-[10px] text-zinc-400">Allgemein</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-500">Land ({selectedState})</div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {examScore.regionalCorrect} / 3
                    </div>
                    <div className="text-[10px] text-zinc-400">Landesspezifisch</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleStartExam}
                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Neue Prüfung starten</span>
                  </button>
                  <button
                    onClick={handleDiscardExam}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Zurück zum Üben
                  </button>
                </div>
              </div>

              {/* Review Filter */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  Detaillierte Fragenauswertung
                </span>
                <div className="flex gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <button
                    onClick={() => setFilterExamReview('all')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      filterExamReview === 'all'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500'
                    }`}
                  >
                    Alle (33)
                  </button>
                  <button
                    onClick={() => setFilterExamReview('wrong')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      filterExamReview === 'wrong'
                        ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-zinc-500'
                    }`}
                  >
                    Nur Fehler ({examScore.wrongList.length})
                  </button>
                </div>
              </div>

              {/* Review Questions List */}
              <div className="space-y-3">
                {examQuestions
                  .filter((q) => filterExamReview === 'all' || examAnswers[q.num] !== q.solution)
                  .map((q, idx) => {
                    const userPick = examAnswers[q.num];
                    const isCorrect = userPick === q.solution;

                    return (
                      <div
                        key={q.num}
                        className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 ${
                          isCorrect
                            ? 'border-emerald-300 dark:border-emerald-800/80'
                            : 'border-rose-300 dark:border-rose-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-zinc-500">
                            #{idx + 1} (Katalog: {q.num})
                          </span>
                          <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                            {isCorrect ? 'Richtig' : userPick ? `Ihre Antwort: (${userPick.toUpperCase()})` : 'Nicht beantwortet'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white">{q.question}</p>

                        <div className="space-y-1.5 text-xs">
                          {(['a', 'b', 'c', 'd'] as const).map((lettr) => {
                            if (!q[lettr]) return null;
                            const isSol = lettr === q.solution;
                            const isUserChoice = lettr === userPick;

                            let optStyle = 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900';
                            if (isSol) {
                              optStyle = 'border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-semibold';
                            } else if (isUserChoice) {
                              optStyle = 'border-rose-500 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 line-through';
                            }

                            return (
                              <div key={lettr} className={`p-2 rounded-lg border flex items-center gap-2 ${optStyle}`}>
                                <span className="font-bold uppercase w-4">{lettr}</span>
                                <span className="flex-1">{q[lettr]}</span>
                                {isSol && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 dark:text-emerald-400" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )
        ) : (
          /* ======================= PRACTICE MODE ======================= */
          <div className="flex flex-col flex-1">
            {currentQuestion && (
              <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-auto">
                {/* Meta info: Shows Question Number AND the Active Set Badge! */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Question Number Badge */}
                    <span className="font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 px-2 py-0.5 rounded-md">
                      {currentQuestion.num.includes('-')
                        ? `Landesfrage: ${currentQuestion.num}`
                        : `Frage #${currentQuestion.num}`}
                    </span>

                    {/* Active Set Badge (Requested by user: display set badge right next to question badge) */}
                    {activeSet && (
                      <span className="font-medium text-xs bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-md flex items-center gap-1 border border-zinc-300 dark:border-zinc-700">
                        <Layers className="w-3 h-3 text-zinc-500" />
                        <span className="truncate max-w-[200px]">{activeSet.title}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-zinc-400 font-mono">
                    {currentIndex + 1} von {displayedQuestions.length}
                  </span>
                </div>

                {/* Question Image if present */}
                {resolveQuestionImageSrc(currentQuestion.image) && (
                  <div className="mb-4 text-center">
                    <img
                      src={resolveQuestionImageSrc(currentQuestion.image)!}
                      alt="Abbildung zur Frage"
                      onClick={() => setZoomedImageSrc(resolveQuestionImageSrc(currentQuestion.image)!)}
                      className="max-h-56 max-w-full mx-auto object-contain rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white p-2 cursor-zoom-in"
                    />
                  </div>
                )}

                {/* German Question Text */}
                <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white leading-snug mb-5">
                  {currentQuestion.question}
                </h1>

                {/* 4 Options */}
                <div className="space-y-2.5">
                  {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                    const text = currentQuestion[letter];
                    if (!text) return null;

                    const hasAnswered = currentAnswer !== null;
                    const isSelected = currentAnswer === letter;
                    const isSolution = letter === currentQuestion.solution;

                    let btnClass = 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800';
                    let keyClass = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200';

                    if (hasAnswered) {
                      if (isSolution) {
                        btnClass = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 font-medium';
                        keyClass = 'bg-emerald-600 text-white';
                      } else if (isSelected) {
                        btnClass = 'border-rose-600 bg-rose-50 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500';
                        keyClass = 'bg-rose-600 text-white';
                      } else {
                        btnClass = 'opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400';
                        keyClass = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';
                      }
                    }

                    return (
                      <button
                        key={letter}
                        onClick={() => handlePracticeAnswer(letter)}
                        disabled={hasAnswered}
                        className={`w-full min-h-[48px] p-3 rounded-xl border text-left transition-all active:scale-[0.99] flex items-start gap-3 disabled:cursor-default cursor-pointer ${btnClass}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 transition-colors ${keyClass}`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm leading-relaxed flex-1 pt-0.5">
                          {text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            )}
          </div>
        )}
      </main>

      {/* 3. UNIFIED BOTTOM FOOTER NAVIGATION (Practice Mode - Fixed / Sticky at bottom on mobile) */}
      {!isExamMode && (
        <footer className="sticky bottom-0 z-20 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 transition-colors shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
          <div className="max-w-2xl mx-auto px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2.5">
              {/* Zurück */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 min-h-[46px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-sm flex items-center justify-center gap-1 shadow-xs disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>

              {/* UNIFIED CENTER PICKER */}
              <button
                onClick={() => setIsNavigatorOpen(true)}
                className="min-h-[46px] px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                title="Fragenliste, Nummernsprung & Sets öffnen"
              >
                <ListFilter className="w-4 h-4 text-zinc-500" />
                <span className="font-mono">
                  {currentQuestion?.num || currentIndex + 1}
                </span>
              </button>

              {/* Weiter */}
              <button
                onClick={handleNext}
                disabled={currentIndex >= displayedQuestions.length - 1}
                className="flex-1 min-h-[46px] px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center gap-1 shadow-xs disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </footer>
      )}

      {/* 4. MODALS */}

      {/* UNIFIED BOTTOM SHEET: Question Grid, Quick Jump & Question Sets */}
      {isNavigatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsNavigatorOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setNavigatorTab('questions')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    navigatorTab === 'questions'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Fragen ({displayedQuestions.length})
                </button>
                <button
                  onClick={() => setNavigatorTab('sets')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    navigatorTab === 'sets'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Fragensets ({availableSets.length})
                </button>
              </div>

              <button
                onClick={() => setIsNavigatorOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB 1: QUESTION JUMP & GRID */}
            {navigatorTab === 'questions' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Jump Search Bar (16px font-size to prevent iOS Safari auto-zoom) */}
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                  <form onSubmit={handleJumpSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9a-zA-Z-]*"
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="Zu Frage springen (z. B. 42 oder NW-1)..."
                        value={jumpQuery}
                        onChange={(e) => {
                          setJumpQuery(e.target.value);
                          setJumpError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-base rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <span>Los</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {jumpError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
                      {jumpError}
                    </p>
                  )}
                </div>

                {/* Scrollable Questions Grid */}
                <div className="p-3.5 overflow-y-auto flex-1 max-h-[50vh]">
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                    {displayedQuestions.map((q, idx) => {
                      const isCurrent = idx === currentIndex;
                      return (
                        <button
                          key={q.num}
                          onClick={() => handleSelectQuestionIndex(idx)}
                          className={`h-9 rounded-lg border text-xs flex items-center justify-center p-0.5 transition-all active:scale-95 cursor-pointer font-mono ${
                            isCurrent
                              ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <span className="truncate">{q.num}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: QUESTION SETS LIST */
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Jump to Set by Page Number */}
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                  <form onSubmit={handleSetJumpSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="Zu Set nach Seitenzahl springen (z. B. 14, 23)..."
                        value={pageJumpQuery}
                        onChange={(e) => {
                          setPageJumpQuery(e.target.value);
                          setPageJumpError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-base rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <span>Los</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {pageJumpError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
                      {pageJumpError}
                    </p>
                  )}
                </div>

                <div className="p-3.5 overflow-y-auto flex-1 max-h-[50vh] space-y-2">
                  {/* Complete Catalog Button */}
                <button
                  onClick={() => handleSelectSet(null)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    activeSet === null
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium ring-1 ring-zinc-900 dark:ring-white'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs">Alle Fragen (Gesamtkatalog)</div>
                    <div className="text-[11px] text-zinc-500">
                      300 Bundesfragen + 10 Landesfragen ({selectedState})
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">310</span>
                </button>

                {/* Available Sets */}
                {availableSets.map((s) => {
                  const isSelected = activeSet?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSet(s)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-medium ring-1 ring-zinc-900 dark:ring-white'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs truncate">{s.title}</div>
                        {s.description && (
                          <div className="text-[11px] text-zinc-500 truncate">{s.description}</div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-zinc-400">
                        {s.questionNumbers.length}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
            )}

            {/* Bottom Sheet Footer: Codename Essen & Version */}
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-1.5">
                <img
                  src="Assets/coats/essen.svg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'essen.svg';
                  }}
                  alt="Essen"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Codename: Essen</span>
              </div>
              <span className="font-mono text-[10px]">v2026.10.07</span>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR MENU OVERLAY */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" />

          {/* Drawer panel */}
          <div
            className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-500" />
                Einstellungen
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-6">

              {/* Bundesland */}
              <section>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Bundesland</p>
                <button
                  onClick={() => { setIsMenuOpen(false); setIsStateModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <img
                    src={`Assets/coats/${selectedState}.png`}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = STATE_COAT_FALLBACKS[selectedState] || ''; }}
                    alt={selectedState}
                    className="w-7 h-7 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-bold text-xs text-zinc-900 dark:text-white">{selectedState}</div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {BUNDESLAENDER.find(l => l.code === selectedState)?.name || selectedState}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                </button>
              </section>

              {/* Exam Mode */}
              <section>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Modus</p>
                <button
                  onClick={() => { setIsMenuOpen(false); handleStartExam(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <GraduationCap className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-zinc-900 dark:text-white">Prüfungssimulation starten</div>
                    <div className="text-[11px] text-zinc-500">33 Fragen, 60 Minuten</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                </button>
              </section>

              {/* Theme */}
              <section>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Erscheinungsbild</p>
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  {([
                    { value: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'Hell' },
                    { value: 'dark',  icon: <Moon className="w-3.5 h-3.5" />, label: 'Dunkel' },
                    { value: 'system',icon: null,                              label: 'System' },
                  ] as const).map(({ value, icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                        theme === value
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {icon}
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer: version */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <img
                src={APP_VERSION_CONFIG.coatOfArmsSrc}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = APP_VERSION_CONFIG.coatOfArmsFallback; }}
                alt="Essen"
                className="w-4 h-4 object-contain flex-shrink-0"
              />
              <span className="font-medium text-zinc-500 dark:text-zinc-400">{APP_VERSION_CONFIG.codename}</span>
              <span>·</span>
              <span className="font-mono">{APP_VERSION_CONFIG.version}</span>
            </div>
          </div>
        </div>
      )}

      {/* EXAM EXIT / EARLY FINISH CONFIRMATION MODAL */}
      {isExamExitPromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsExamExitPromptOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 mx-auto flex items-center justify-center mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base mb-1 text-zinc-900 dark:text-white">
              Prüfung beenden?
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Sie haben <strong>{Object.values(examAnswers).filter(Boolean).length} von 33</strong> Fragen beantwortet.
              Möchten Sie die Prüfung abgeben und das Ergebnis auswerten, oder abbrechen?
            </p>

            <div className="space-y-2">
              <button
                onClick={handleFinishExamAndShowResults}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
              >
                Prüfung abgeben & Auswertung anzeigen
              </button>

              <button
                onClick={() => setIsExamExitPromptOpen(false)}
                className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Prüfung fortsetzen
              </button>

              <button
                onClick={handleDiscardExam}
                className="w-full py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Abbrechen & zum Üben zurückkehren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bundesland Selector Modal */}
      {isStateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsStateModalOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  Bundesland auswählen
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Lädt 10 landesspezifische Fragen für Ihr Bundesland
                </p>
              </div>
              <button
                onClick={() => setIsStateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto grid grid-cols-2 gap-2 max-h-[60vh]">
              {BUNDESLAENDER.map((land) => {
                const isSelected = land.code === selectedState;
                return (
                  <button
                    key={land.code}
                    onClick={() => handleSelectState(land.code)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white ring-1 ring-zinc-900 dark:ring-white font-medium'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <img
                      src={`Assets/coats/${land.code}.png`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = STATE_COAT_FALLBACKS[land.code] || '';
                      }}
                      alt={land.code}
                      className="w-7 h-7 object-contain flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs">
                        {land.code}
                      </div>
                      <div className="text-[11px] font-medium truncate text-zinc-500">
                        {land.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setZoomedImageSrc(null)}
        >
          <div
            className="max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 p-2 rounded-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImageSrc}
              alt="Vergrößert"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
            />
            <button
              onClick={() => setZoomedImageSrc(null)}
              className="mt-2 w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
