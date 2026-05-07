'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Question, QuestionType, Word, WordProgress } from '@/types';
import { speak, speakEnglish, stopSpeaking, startListening, isSpeechSupported } from '@/lib/voice';

interface Props {
  messages: ChatMessage[];
  currentQuestion: Question | null;
  words: Word[];
  progress: Record<string, WordProgress>;
  masteredCount: number;
  totalWords: number;
  isListening: boolean;
  isSpeaking: boolean;
  onSubmitAnswer: (answer: string) => void;
  onStartListening: (lang?: string) => void;
  onStopListening: () => void;
  onCoachSpeak: () => void;
  onStartExam: () => void;
  phase: string;
}

const typeConfig: Record<QuestionType, { label: string; icon: string; bg: string; border: string; text: string }> = {
  reading: { label: '阅读', icon: '📖', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  listening: { label: '听力', icon: '🎧', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  writing: { label: '写作', icon: '✍️', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  speaking: { label: '口语', icon: '🗣️', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
};

export default function TrainingPhase({
  messages, currentQuestion, words, progress, masteredCount, totalWords,
  isListening, isSpeaking, onSubmitAnswer, onStartListening, onStopListening, onCoachSpeak,
  onStartExam, phase,
}: Props) {
  const [textInput, setTextInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak new coach messages
  useEffect(() => {
    if (!autoSpeak) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'coach' && lastMsg.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = lastMsg.id;
      const cleanText = lastMsg.content.replace(/\*\*/g, '').replace(/---/g, '').replace(/\n/g, '。');
      speak(cleanText, 1.1).catch(() => {});
      // If listening question, also play the word audio
      if (lastMsg.question?.audioNeeded) {
        const word = words.find(w => w.id === lastMsg.question!.wordId);
        if (word) {
          setTimeout(() => speakEnglish(word.word, 0.7).catch(() => {}), 500);
        }
      }
    }
  }, [messages, autoSpeak, words]);

  const handleSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    onSubmitAnswer(textInput.trim());
    setTextInput('');
  }, [textInput, onSubmitAnswer]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else {
      const lang = currentQuestion?.type === 'writing' || currentQuestion?.type === 'listening' ? 'en-US' : 'zh-CN';
      onStartListening(lang);
    }
  }, [isListening, currentQuestion, onStartListening, onStopListening]);

  const playWordAudio = useCallback(async () => {
    if (!currentQuestion) return;
    const word = words.find(w => w.id === currentQuestion.wordId);
    if (word) {
      await speakEnglish(word.word, 0.7);
    }
  }, [currentQuestion, words]);

  const progressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const allMastered = masteredCount === totalWords && totalWords > 0;
  const qInfo = currentQuestion ? typeConfig[currentQuestion.type] : null;

  // Get current word for display
  const currentWord = currentQuestion ? words.find(w => w.id === currentQuestion.wordId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header Bar */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3 flex items-center gap-4 shrink-0">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white font-bold text-sm">{masteredCount} / {totalWords} 已掌握</span>
            <span className="text-gray-400 text-xs">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {qInfo && currentQuestion && (
          <div className={`${qInfo.bg} ${qInfo.border} border rounded-lg px-3 py-1.5 text-center`}>
            <span className="text-sm">{qInfo.icon}</span>
            <span className={`ml-1 text-xs font-bold ${qInfo.text}`}>{qInfo.label}</span>
          </div>
        )}
      </div>

      {/* Current Word Display */}
      {currentWord && currentQuestion && (
        <div className="bg-gray-800/50 border-b border-gray-700/30 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-lg font-bold">{currentWord.word}</span>
            {currentWord.phonetic && (
              <span className="text-gray-500 text-sm">/{currentWord.phonetic}/</span>
            )}
          </div>
          {currentQuestion.audioNeeded && (
            <button
              onClick={playWordAudio}
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
            >
              🔊 播放发音
            </button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
              ${msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-gray-700/80 text-gray-100 rounded-bl-sm border border-gray-600/30'}
            `}>
              {msg.role === 'coach' && (
                <div className="text-xs text-gray-400 mb-1 font-medium">教练</div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="text-emerald-300 font-bold">{part}</strong> : part
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Final Exam Button */}
      {allMastered && phase === 'exam' && (
        <div className="px-4 py-3 shrink-0 animate-fade-in">
          <button
            onClick={onStartExam}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🏆 所有单词已掌握！开始最终考核
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700/50 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mic button - prominent */}
          <div className="relative">
            <button
              onClick={handleVoiceInput}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 transition-all shadow-lg
                ${isListening
                  ? 'bg-red-500 text-white shadow-red-500/30 scale-110'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20 hover:scale-105 active:scale-95'}
              `}
              title={isListening ? '停止录音' : '按住说话'}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-pulse-ring" />
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-gray-700/50 border border-gray-600/50 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={isListening ? '正在听...' : '输入答案或按麦克风说话...'}
              className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm placeholder:text-gray-500"
              disabled={isListening}
            />
            {textInput && (
              <button 
                onClick={handleSubmit} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 text-sm font-semibold transition-colors"
              >
                发送 ↵
              </button>
            )}
          </div>

          {/* Speaker button */}
          <button
            onClick={onCoachSpeak}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 transition-all
              ${isSpeaking 
                ? 'bg-blue-500 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
            `}
            title="教练朗读当前题目"
          >
            🔊
          </button>
        </div>

        {/* Status hints */}
        <div className="flex items-center justify-between mt-2 px-1">
          {!isSpeechSupported() ? (
            <p className="text-yellow-500/80 text-xs">⚠️ 语音识别不可用，请使用 Chrome</p>
          ) : (
            <p className="text-gray-600 text-xs">
              {isListening ? '🔴 录音中...' : '点击麦克风语音作答'}
            </p>
          )}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            {autoSpeak ? '🔊 自动朗读' : '🔇 静音模式'}
          </button>
        </div>
      </div>
    </div>
  );
}
