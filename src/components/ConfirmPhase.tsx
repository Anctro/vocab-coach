'use client';

import { Word } from '@/types';

interface Props {
  words: Word[];
  totalCount: number;
  onConfirm: () => void;
}

export default function ConfirmPhase({ words, totalCount, onConfirm }: Props) {
  const first5 = words.slice(0, 5);
  const last5 = words.slice(-5);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-lg w-full animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">📋 解析结果</h2>

        <div className="text-center mb-6">
          <div className="text-7xl font-black text-emerald-400 mb-2">{totalCount}</div>
          <div className="text-gray-400">个单词被识别</div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-700/40 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">前5个单词</div>
            <div className="flex flex-wrap gap-2">
              {first5.map(w => (
                <span key={w.id} className="bg-gray-600/60 border border-gray-500/30 px-3 py-1.5 rounded-lg text-white text-sm font-medium">{w.word}</span>
              ))}
            </div>
          </div>
          <div className="bg-gray-700/40 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">后5个单词</div>
            <div className="flex flex-wrap gap-2">
              {last5.map(w => (
                <span key={w.id} className="bg-gray-600/60 border border-gray-500/30 px-3 py-1.5 rounded-lg text-white text-sm font-medium">{w.word}</span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          数量正确，开始训练！🔥
        </button>
      </div>
    </div>
  );
}
