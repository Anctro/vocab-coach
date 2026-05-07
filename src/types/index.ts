export interface Word {
  id: string;
  word: string;
  phonetic?: string;
  meanings: string[];
  examples?: string[];
}

export type QuestionType = 'reading' | 'listening' | 'writing' | 'speaking';

export interface Question {
  id: string;
  wordId: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  audioNeeded?: boolean;
}

export interface DimProgress {
  attempts: number;
  consecutive: number;
  mastered: boolean;
}

export interface WordProgress {
  wordId: string;
  reading: DimProgress;
  listening: DimProgress;
  writing: DimProgress;
  speaking: DimProgress;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  question?: Question;
  timestamp: number;
}

export interface AppState {
  words: Word[];
  progress: Record<string, WordProgress>;
  messages: ChatMessage[];
  currentQuestion: Question | null;
  isActive: boolean;
  phase: 'upload' | 'confirm' | 'training' | 'exam' | 'done';
  masteredCount: number;
}
