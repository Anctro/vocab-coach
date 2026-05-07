import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '单词精通教练 | Vocab Coach',
  description: '严苛的单词精通教练 - 听说读写四维训练',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
