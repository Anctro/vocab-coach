'use client';

import { Word } from '@/types';

interface Props {
  words: Word[];
  totalCount: number;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ConfirmPhase({ words, totalCount, onConfirm, onBack }: Props) {
  const sampleWords = words.slice(0, 8).map(w => w.word);
  const lastWords = words.slice(-5).map(w => w.word);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-5 shadow-lg shadow-emerald-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">词本解析完成</h2>
          <p className="text-zinc-400">请确认以下信息后开始训练</p>
        </div>

        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-zinc-400">识别单词总数</span>
            <span className="text-3xl font-bold text-amber-400">{totalCount}</span>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-zinc-500 text-sm">前 8 个词：</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {sampleWords.map(w => (
                  <span key={w} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-sm">{w}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 text-sm">后 5 个词：</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {lastWords.map(w => (
                  <span key={w} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-sm">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4 mb-8 space-y-2">
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <span className="text-amber-500">&#9670;</span> 每个单词从听说读写四个维度考核
          </p>
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <span className="text-amber-500">&#9670;</span> 每维度连续正确 2 次即标记掌握
          </p>
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <span className="text-amber-500">&#9670;</span> 全部掌握后触发结业大考
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-all"
          >
            重新选择
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            确认，开始训练
          </button>
        </div>
      </div>
    </div>
  );
}
