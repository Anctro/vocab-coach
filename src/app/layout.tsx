import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '单词精通教练 | Vocab Coach',
  description: '四维语音交互式单词训练',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
