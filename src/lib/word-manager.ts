import { Word, WordProgress, QuestionType, Question, DimProgress } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const dim = (): DimProgress => ({ attempts: 0, consecutive: 0, mastered: false });

export function initProgress(words: Word[]): Record<string, WordProgress> {
  const p: Record<string, WordProgress> = {};
  for (const w of words) {
    p[w.id] = { wordId: w.id, reading: dim(), listening: dim(), writing: dim(), speaking: dim() };
  }
  return p;
}

export function isMastered(p: WordProgress): boolean {
  return p.reading.mastered && p.listening.mastered && p.writing.mastered && p.speaking.mastered;
}

export function masteredCount(progress: Record<string, WordProgress>): number {
  return Object.values(progress).filter(isMastered).length;
}

export function unmasteredWords(words: Word[], progress: Record<string, WordProgress>): Word[] {
  return words.filter(w => !isMastered(progress[w.id]));
}

export function nextQuestionType(last: QuestionType | null, wp: WordProgress): QuestionType {
  const types: QuestionType[] = ['reading', 'listening', 'writing', 'speaking'];
  const unmastered = types.filter(t => !wp[t].mastered);
  if (unmastered.length === 0) return types[Math.floor(Math.random() * types.length)];
  // prefer weakest
  unmastered.sort((a, b) => wp[a].consecutive - wp[b].consecutive);
  const weakest = unmastered[0];
  if (weakest !== last) return weakest;
  const others = unmastered.filter(t => t !== last);
  return others.length > 0 ? others[Math.floor(Math.random() * others.length)] : weakest;
}

export function makeQuestion(word: Word, type: QuestionType): Question {
  const id = uuidv4();
  switch (type) {
    case 'reading':
      return { id, wordId: word.id, type, prompt: `单词 "${word.word}" 的核心释义是什么？`, correctAnswer: word.meanings.join('；') };
    case 'listening':
      return { id, wordId: word.id, type, prompt: `请听发音，拼写该单词并写出释义。`, correctAnswer: `${word.word}：${word.meanings.join('；')}`, audioNeeded: true };
    case 'writing':
      return { id, wordId: word.id, type, prompt: `请拼写意为"${word.meanings[0]}"的英语单词。`, correctAnswer: word.word };
    case 'speaking':
      return { id, wordId: word.id, type, prompt: `请用 "${word.word}" 造一个有实际内容的句子。`, correctAnswer: word.examples?.[0] || word.word };
  }
}

export function pickNextWord(words: Word[], progress: Record<string, WordProgress>, lastId?: string): Word {
  const pool = unmasteredWords(words, progress);
  if (pool.length === 0) return words[Math.floor(Math.random() * words.length)];
  const candidates = lastId ? pool.filter(w => w.id !== lastId) : pool;
  if (candidates.length === 0) return pool[0];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function updateProgress(
  progress: Record<string, WordProgress>,
  wordId: string,
  dimension: QuestionType,
  correct: boolean
): Record<string, WordProgress> {
  const p = { ...progress };
  const old = p[wordId];
  if (!old) return p;
  const d = { ...old[dimension] };
  if (correct) {
    d.attempts += 1;
    d.consecutive += 1;
    if (d.consecutive >= 2) d.mastered = true;
  } else {
    d.attempts += 1;
    d.consecutive = 0;
    d.mastered = false;
  }
  p[wordId] = { ...old, [dimension]: d };
  return p;
}

export function checkAnswer(question: Question, userAnswer: string): { correct: boolean; feedback: string } {
  const ans = userAnswer.trim().toLowerCase();
  const correct = question.correctAnswer.trim().toLowerCase();
  
  switch (question.type) {
    case 'reading': {
      // User should provide Chinese meaning, check if any meaning is covered
      const meanings = question.correctAnswer.split('；').map(m => m.trim().toLowerCase());
      const hit = meanings.some(m => ans.includes(m) || m.includes(ans));
      if (hit) return { correct: true, feedback: '✅ 释义正确！' };
      return { correct: false, feedback: `❌ 不正确。核心释义是：${question.correctAnswer}` };
    }
    case 'listening': {
      // User should spell the word AND give meaning
      // Extract just the word part from correctAnswer
      const wordPart = question.correctAnswer.split('：')[0].trim().toLowerCase();
      if (ans === wordPart) return { correct: true, feedback: '✅ 拼写正确！' };
      if (ans.includes(wordPart)) return { correct: true, feedback: '✅ 拼写正确！' };
      // Check for minor errors
      if (levenshtein(ans, wordPart) <= 2 && wordPart.length > 4) {
        return { correct: false, feedback: `❌ 接近但不完全正确。正确拼写：${wordPart}` };
      }
      return { correct: false, feedback: `❌ 拼写不正确。正确答案是：${question.correctAnswer}` };
    }
    case 'writing': {
      const expected = question.correctAnswer.trim().toLowerCase();
      if (ans === expected) return { correct: true, feedback: '✅ 拼写完全正确！' };
      if (levenshtein(ans, expected) <= 1 && expected.length > 3) {
        return { correct: false, feedback: `❌ 差一点！正确拼写：${expected}` };
      }
      return { correct: false, feedback: `❌ 不正确。正确拼写：${expected}` };
    }
    case 'speaking': {
      // Basic check: answer should contain the word and be a reasonable sentence
      const word = question.correctAnswer.trim().toLowerCase();
      if (ans.length < 5) return { correct: false, feedback: '❌ 句子太短了，请造一个更完整的句子。' };
      if (!ans.includes(word.split(' ')[0])) {
        return { correct: false, feedback: `❌ 句子中似乎没有使用目标单词。请用 "${word}" 造句。` };
      }
      return { correct: true, feedback: '✅ 造句不错！' };
    }
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}
