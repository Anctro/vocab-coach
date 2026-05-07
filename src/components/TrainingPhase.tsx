'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Question, QuestionType, Word, WordProgress } from '@/types';
import { speak, speakEnglish, stopSpeaking, startListening, isSpeechSupported } from '@/lib/voice';

interface Props {
  words: Word[];
  progress: Record<string, WordProgress>;
  messages: ChatMessage[];
  currentQuestion: Question | null;
  masteredCount: number;
  onAnswer: (answer: string) => void;
  onSpeak: (text?: string) => void;
  onReset: () => void;
}

const DIM_LABELS: Record<QuestionType, { label: string; icon: string; color: string }> = {
  reading: { label: '阅读', icon: '\u{1F4D6}', color: 'from-blue-500 to-cyan-500' },
  listening: { label: '听力', icon: '\u{1F3A7}', color: 'from-purple-500 to-pink-500' },
  writing: { label: '写作', icon: '\u270D\uFE0F', color: 'from-emerald-500 to-teal-500' },
  speaking: { label: '口语', icon: '\u{1F3C4}', color: 'from-amber-500 to-orange-500' },
};

export default function TrainingPhase({
  words, progress, messages, currentQuestion, masteredCount, onAnswer, onSpeak, onReset
}: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listenerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (currentQuestion?.audioNeeded && messages.length > 0) {
      const word = words.find(w => w.id === currentQuestion.wordId);
      if (word) {
        const timer = setTimeout(() => {
          speakEnglish(word.word, 0.8).catch(console.error);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestion?.id, currentQuestion?.audioNeeded, messages.length, words]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'coach' && messages.length > 1) {
      const clean = lastMsg.content.replace(/\*\*/g, '').replace(/---/g, '').replace(/\n/g, '。');
      setIsSpeaking(true);
      speak(clean, 1.1).finally(() => setIsSpeaking(false));
    }
  }, [messages.length]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onAnswer(input.trim());
    setInput('');
  };

  const handleVoiceInput = () => {
    if (isListening) {
      listenerRef.current?.stop();
      setIsListening(false);
      return;
    }
    stopSpeaking();
    setIsListening(true);
    const lang = currentQuestion?.type === 'speaking' ? 'en-US' : 'zh-CN';
    listenerRef.current = startListening(
      (result) => {
        setIsListening(false);
        listenerRef.current = null;
        if (result.transcript) {
          onAnswer(result.transcript);
        }
      },
      (error) => {
        setIsListening(false);
        listenerRef.current = null;
        console.error(error);
      },
      lang
    );
  };

  const handleReplay = async () => {
    if (!currentQuestion) return;
    const word = words.find(w => w.id === currentQuestion.wordId);
    if (word) {
      setIsSpeaking(true);
      try {
        await speakEnglish(word.word, 0.8);
      } catch (e) { console.error(e); }
      setIsSpeaking(false);
    }
  };

  const total = words.length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  const dimInfo = currentQuestion ? DIM_LABELS[currentQuestion.type] : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={onReset} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-zinc-300 font-semibold text-sm">单词精通教练</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-lg">{masteredCount}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{total}</span>
              <span className="text-zinc-600 text-sm ml-1">({pct}%)</span>
            </div>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-amber-600/20 border border-amber-600/30 text-amber-100'
                  : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-200'
                }
              `}>
                {msg.role === 'coach' && msg.question && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-zinc-700/50">
                    <span className="text-xs">{DIM_LABELS[msg.question.type].icon}</span>
                    <span className={`text-xs font-medium bg-gradient-to-r ${DIM_LABELS[msg.question.type].color} bg-clip-text text-transparent`}>
                      {DIM_LABELS[msg.question.type].label}考核
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Question Badge */}
      {currentQuestion && dimInfo && (
        <div className="flex-shrink-0 border-t border-zinc-800/30">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${dimInfo.color} text-white text-xs font-medium`}>
              {dimInfo.icon} {dimInfo.label}题
            </div>
            {currentQuestion.audioNeeded && (
              <button
                onClick={handleReplay}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title="重新播放发音"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {isSpeechSupported() && (
              <button
                onClick={handleVoiceInput}
                className={`
                  relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }
                `}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                )}
                <svg className="w-5 h-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-16a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3z" />
                </svg>
              </button>
            )}

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder={isListening ? '正在听你说话...' : '输入答案，回车提交...'}
              className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              disabled={isListening}
            />

            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m-7 7l7-7 7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
