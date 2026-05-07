'use client';

import { useState, useRef } from 'react';
import { parsePDF } from '@/lib/pdf-parser';
import { Word } from '@/types';
import { CET6_WORDS, CET6_TOTAL } from '@/lib/cet6-vocabulary';

interface Props {
  onWordsLoaded: (words: Word[]) => void;
}

export default function UploadPhase({ onWordsLoaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      alert('请上传 PDF 文件');
      return;
    }
    setLoading(true);
    try {
      
      const result = await parsePDF(file);
      onWordsLoaded(result.words);
    } catch (e) {
      console.error(e);
      alert('PDF 解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCET6 = () => {
    onWordsLoaded(CET6_WORDS);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-6 shadow-lg shadow-amber-500/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">单词精通教练</h1>
          <p className="text-zinc-400 text-lg">四维考核 · 语音交互 · 严格判分</p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
            ${dragOver
              ? 'border-amber-500 bg-amber-500/10 scale-[1.02]'
              : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900/80'
            }
          `}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-zinc-300">正在解析 PDF...</p>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-zinc-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-zinc-300 font-medium mb-1">上传 PDF 单词书</p>
              <p className="text-zinc-500 text-sm">拖拽文件到此处，或点击选择</p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-sm">或者</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* CET-6 Button */}
        <button
          onClick={handleCET6}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          使用内置 CET-6 词本（{CET6_TOTAL} 词）
        </button>

        {/* Tips */}
        <div className="mt-8 space-y-2">
          <p className="text-zinc-500 text-xs flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            推荐使用 Chrome 浏览器以获得最佳语音体验
          </p>
          <p className="text-zinc-500 text-xs flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            听说读写四维考核，每维连续两次通过即掌握
          </p>
        </div>
      </div>
    </div>
  );
}
