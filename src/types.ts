export type BundeslandCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export interface Bundesland {
  code: BundeslandCode;
  name: string;
  capital: string;
  crestSvg?: string;
}

export interface Question {
  id?: string;
  num: string; // "1", "2", ... "300" or "NW-1", "BY-8", etc.
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  solution: 'a' | 'b' | 'c' | 'd';
  image?: string;
  category?: string;
  translationUk?: {
    question?: string;
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    tip?: string;
  };
}

export interface QuestionSet {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  questionNumbers: string[]; // e.g. ["1", "2", "3", ...]
  isCustom?: boolean;
  category?: 'book' | 'topic' | 'custom' | 'review';
}

export type AppMode = 'practice' | 'sets' | 'exam';

export interface ExamAnswer {
  questionNum: string;
  selectedOption: 'a' | 'b' | 'c' | 'd' | null;
  isFlagged?: boolean;
}

export interface ExamSession {
  id: string;
  date: string;
  bundesland: BundeslandCode;
  questions: Question[];
  answers: Record<string, 'a' | 'b' | 'c' | 'd' | null>;
  flagged: Record<string, boolean>;
  timeRemainingSeconds: number;
  totalTimeSeconds: number;
  isCompleted: boolean;
  score?: number;
  passed?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
