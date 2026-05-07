'use client';

import { useState, useCallback, useRef } from 'react';
import { Word, WordProgress, Question, QuestionType, ChatMessage, AppState } from '@/types';
import {
  initProgress, isMastered, masteredCount, pickNextWord,
  nextQuestionType, makeQuestion, updateProgress, checkAnswer
} from '@/lib/word-manager';
import { speak, speakEnglish, stopSpeaking, startListening, isSpeechSupported } from '@/lib/voice';

const initialState: AppState = {
  words: [],
  progress: {},
  messages: [],
  currentQuestion: null,
  isActive: false,
  phase: 'upload',
  masteredCount: 0,
};

export function useCoach() {
  const [state, setState] = useState<AppState>(initialState);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const listenerRef = useRef<{ stop: () => void } | null>(null);

  // Load words from parsed PDF
  const loadWords = useCallback((words: Word[], _totalCount?: number) => {
    const progress = initProgress(words);
    const first5 = words.slice(0, 5).map(w => w.word);
    const last5 = words.slice(-5).map(w => w.word);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'coach',
      content: `文件读取完成。我识别到共 **${words.length}** 个单词。\n\n前5个：${first5.join(', ')}\n后5个：${last5.join(', ')}\n\n**请确认总数是否正确？确认后，我们将立即开始训练。**`,
      timestamp: Date.now(),
    };
    setState(s => ({
      ...s, words, progress, messages: [msg],
      phase: 'confirm', masteredCount: 0,
    }));
  }, []);

  // Confirm and start training
  const confirmStart = useCallback(() => {
    setState(s => {
      if (s.words.length === 0) return s;
      const word = pickNextWord(s.words, s.progress);
      const wp = s.progress[word.id];
      const qType = nextQuestionType(null, wp);
      const question = makeQuestion(word, qType);
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: `好！训练正式开始！我会随机出题，从听说读写四个维度考核你。\n\n${question.prompt}`,
        question,
        timestamp: Date.now(),
      };
      return { ...s, phase: 'training', currentQuestion: question, messages: [...s.messages, msg], isActive: true };
    });
  }, []);

  // Ask next question
  const askNext = useCallback((prevState: AppState) => {
    const word = pickNextWord(prevState.words, prevState.progress, prevState.currentQuestion?.wordId);
    const wp = prevState.progress[word.id];
    const lastType = prevState.currentQuestion?.type || null;
    const qType = nextQuestionType(lastType, wp);
    const question = makeQuestion(word, qType);
    const mc = masteredCount(prevState.progress);

    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'coach',
      content: `**${mc}/${prevState.words.length}** | ${question.prompt}`,
      question,
      timestamp: Date.now(),
    };
    return { question, msg, mc };
  }, []);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    setState(s => {
      if (!s.currentQuestion) return s;

      const q = s.currentQuestion;
      const result = checkAnswer(q, answer);
      const newProgress = updateProgress(s.progress, q.wordId, q.type, result.correct);
      const mc = masteredCount(newProgress);
      const word = s.words.find(w => w.id === q.wordId);

      const userMsg: ChatMessage = {
        id: (Date.now() - 1).toString(),
        role: 'user',
        content: answer,
        timestamp: Date.now(),
      };

      let coachContent = result.feedback;
      if (result.correct && word) {
        const wp = newProgress[word.id];
        if (isMastered(wp)) {
          coachContent += `\n🎉 **"${word.word}" 已完全掌握！**`;
        }
      }
      if (mc > 0 && mc % 10 === 0) {
        coachContent += `\n💪 里程碑！已掌握 ${mc} 个单词！继续加油！`;
      }

      const { question: nextQ, msg: coachMsg } = askNext({
        ...s, progress: newProgress, currentQuestion: q, masteredCount: mc,
      });

      const coachResponse: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: coachContent + '\n\n---\n' + coachMsg.content,
        question: nextQ,
        timestamp: Date.now(),
      };

      // Check if all mastered
      const allDone = mc === s.words.length && s.words.length > 0;
      const newPhase = allDone ? 'exam' : s.phase;

      return {
        ...s,
        progress: newProgress,
        messages: [...s.messages, userMsg, coachResponse],
        currentQuestion: nextQ,
        masteredCount: mc,
        phase: newPhase,
      };
    });
  }, [askNext]);

  // Start listening
  const startVoiceInput = useCallback((lang: string = 'zh-CN') => {
    if (isListening) return;
    stopSpeaking();
    setIsListening(true);

    listenerRef.current = startListening(
      (result) => {
        setIsListening(false);
        listenerRef.current = null;
        if (result.transcript) {
          submitAnswer(result.transcript);
        }
      },
      (error) => {
        setIsListening(false);
        listenerRef.current = null;
        console.error(error);
      },
      lang
    );
  }, [isListening, submitAnswer]);

  // Stop listening
  const stopVoiceInput = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current.stop();
      listenerRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Coach speaks current question
  const coachSpeak = useCallback(async (text?: string) => {
    const content = text || state.messages[state.messages.length - 1]?.content || '';
    setIsSpeaking(true);
    try {
      // If current question needs English audio, speak the word
      if (state.currentQuestion?.audioNeeded) {
        const word = state.words.find(w => w.id === state.currentQuestion!.wordId);
        if (word) {
          await speakEnglish(word.word);
        }
      }
      // Then speak the Chinese prompt
      // Clean markdown for speech
      const cleanText = content.replace(/\*\*/g, '').replace(/---/g, '').replace(/\n/g, '。');
      await speak(cleanText, 1.1);
    } catch (e) {
      console.error('TTS error:', e);
    }
    setIsSpeaking(false);
  }, [state.messages, state.currentQuestion, state.words]);

  // Start final exam
  const startFinalExam = useCallback(() => {
    setState(prev => {
      const examMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: `🔥 **最终考核开始！**\n\n所有 ${prev.words.length} 个单词都将被考核，每个维度一题。准备好了吗？`,
        timestamp: Date.now(),
      };
      return { ...prev, phase: 'exam', messages: [...prev.messages, examMsg] };
    });
  }, []);

  // Reset
  const reset = useCallback(() => {
    stopSpeaking();
    stopVoiceInput();
    setState(initialState);
  }, []);

  return {
    state,
    isListening,
    isSpeaking,
    loadWords,
    confirmStart,
    submitAnswer,
    startVoiceInput,
    stopVoiceInput,
    coachSpeak,
    startFinalExam,
    reset,
  };
}
