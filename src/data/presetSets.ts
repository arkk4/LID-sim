import { QuestionSet } from '../types';

export const PRESET_QUESTION_SETS: QuestionSet[] = [
  {
    id: 'book-p10-25',
    title: 'Lehrbuch: Seiten 10–25',
    subtitle: 'Fragen 1–30',
    description: 'Demokratie, Rechtsstaat und Gewaltenteilung in Deutschland',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 1))
  },
  {
    id: 'book-p26-40',
    title: 'Lehrbuch: Seiten 26–40',
    subtitle: 'Fragen 31–60',
    description: 'Wahlen, Parteien, Bundestag und Bundesrat',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 31))
  },
  {
    id: 'book-p41-55',
    title: 'Lehrbuch: Seiten 41–55',
    subtitle: 'Fragen 61–90',
    description: 'Bundesorgane, Gerichte und Bundesverfassungsgericht (BVerfG)',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 61))
  },
  {
    id: 'book-p56-70',
    title: 'Lehrbuch: Seiten 56–70',
    subtitle: 'Fragen 91–120',
    description: 'Grundrechte, Grundgesetz und Bürgerpflichten',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 91))
  },
  {
    id: 'book-p71-85',
    title: 'Lehrbuch: Seiten 71–85',
    subtitle: 'Fragen 121–150',
    description: 'Weimarer Republik, Nationalsozialismus und Zweiter Weltkrieg',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 121))
  },
  {
    id: 'book-p86-100',
    title: 'Lehrbuch: Seiten 86–100',
    subtitle: 'Fragen 151–180',
    description: 'Nachkriegsdeutschland, Gründung BRD und DDR, Berliner Mauer',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 151))
  },
  {
    id: 'book-p101-115',
    title: 'Lehrbuch: Seiten 101–115',
    subtitle: 'Fragen 181–210',
    description: 'Friedliche Revolution 1989 und Deutsche Wiedervereinigung',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 181))
  },
  {
    id: 'book-p116-130',
    title: 'Lehrbuch: Seiten 116–130',
    subtitle: 'Fragen 211–240',
    description: 'Deutschland in Europa, Europäische Union (EU), NATO',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 211))
  },
  {
    id: 'book-p131-145',
    title: 'Lehrbuch: Seiten 131–145',
    subtitle: 'Fragen 241–270',
    description: 'Bildung, Schulsystem, Arbeitsmarkt und Sozialversicherung',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 241))
  },
  {
    id: 'book-p146-160',
    title: 'Lehrbuch: Seiten 146–160',
    subtitle: 'Fragen 271–300',
    description: 'Familie, Religionsfreiheit, Gleichberechtigung und Alltag',
    category: 'book',
    questionNumbers: Array.from({ length: 30 }, (_, i) => String(i + 271))
  },

  // Thematic blocks
  {
    id: 'topic-politics',
    title: 'Themenblock 1: Politik in der Demokratie',
    subtitle: '100 Fragen (1–100)',
    description: 'Staatsaufbau, Grundgesetz, Wahlen, Parteien und Gerichte',
    category: 'topic',
    questionNumbers: Array.from({ length: 100 }, (_, i) => String(i + 1))
  },
  {
    id: 'topic-history',
    title: 'Themenblock 2: Geschichte und Verantwortung',
    subtitle: '100 Fragen (101–200)',
    description: 'Deutsche Geschichte, NS-Diktatur, Teilung und Mauerfall',
    category: 'topic',
    questionNumbers: Array.from({ length: 100 }, (_, i) => String(i + 101))
  },
  {
    id: 'topic-society',
    title: 'Themenblock 3: Mensch und Gesellschaft',
    subtitle: '100 Fragen (201–300)',
    description: 'EU, Gesellschaft, Religionsfreiheit, Familie und Sozialstaat',
    category: 'topic',
    questionNumbers: Array.from({ length: 100 }, (_, i) => String(i + 201))
  },

  // Regional set
  {
    id: 'state-regional-10',
    title: 'Landesfragen (Gewähltes Bundesland)',
    subtitle: '10 landesspezifische Fragen',
    description: 'Wappen, Landkarte, Hauptstadt und Parlament des Bundeslandes',
    category: 'topic',
    questionNumbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  }
];
