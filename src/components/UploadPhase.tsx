'use client';

import { useState, useRef } from 'react';
import { parsePDF } from '@/lib/pdf-parser';
import { Word } from '@/types';

interface Props {
  onWordsLoaded: (words: Word[], totalCount: number) => void;
}

export default function UploadPhase({ onWordsLoaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('请上传 PDF 文件');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await parsePDF(file);
      if (result.totalCount === 0) {
        setError('未能从 PDF 中识别到单词，请检查文件格式');
        return;
      }
      onWordsLoaded(result.words, result.totalCount);
    } catch (e: any) {
      setError(`解析失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center mb-10 animate-fade-in">
        <div className="text-6xl mb-4 animate-float">🏋️</div>
        <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
          单词精通教练
        </h1>
        <p className="text-gray-400 text-lg max-w-sm mx-auto">
          上传单词书 PDF，开始听说读写四维训练
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">📖 阅读</span>
          <span className="flex items-center gap-1">🎧 听力</span>
          <span className="flex items-center gap-1">✍️ 写作</span>
          <span className="flex items-center gap-1">🗣️ 口语</span>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative z-10 w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 group
          ${dragOver 
            ? 'border-emerald-400 bg-emerald-400/10 scale-105' 
            : 'border-gray-600 hover:border-emerald-400/50 bg-gray-800/30 hover:bg-gray-800/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {loading ? (
          <div className="text-emerald-400">
            <div className="inline-block w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mb-3" />
            <p className="text-lg font-medium">正在解析 PDF...</p>
            <p className="text-sm text-gray-500 mt-1">首次加载可能需要几秒钟</p>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-4 transition-transform group-hover:scale-110">📚</div>
            <p className="text-white text-lg font-semibold mb-1">拖拽 PDF 文件到此处</p>
            <p className="text-gray-500 text-sm">或点击选择文件</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-sm">
              <span>🔍</span>
              <span>支持各种单词书格式</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="relative z-10 mt-4 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg animate-fade-in">
          {error}
        </div>
      )}

      <p className="relative z-10 mt-8 text-gray-600 text-xs">
        推荐使用 Chrome 浏览器以获得最佳语音体验
      </p>
    </div>
  );
}
