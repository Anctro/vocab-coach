// Client-side PDF parser using browser's PDF.js (loaded via CDN)
import { Word } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function parsePDF(file: File): Promise<{ words: Word[]; totalCount: number }> {
  // Dynamically load pdf.js from CDN
  const pdfjsLib = await loadPdfJs();
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const allText: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    allText.push(pageText);
  }
  
  const fullText = allText.join('\n');
  return extractWords(fullText);
}

async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
    script.type = 'module';
    
    // Use global callback approach
    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script2.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('Failed to load PDF.js'));
      }
    };
    script2.onerror = () => reject(new Error('Failed to load PDF.js script'));
    document.head.appendChild(script2);
  });
}

function extractWords(text: string): { words: Word[]; totalCount: number } {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const words: Word[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    let word: Word | null = null;

    // Pattern 1: word /phonetic/ meaning
    const m1 = t.match(/^([a-zA-Z][a-zA-Z\-']*)\s*\/([^/]+)\/\s*(.+)$/);
    if (m1) {
      word = {
        id: uuidv4(), word: m1[1].trim().toLowerCase(), phonetic: m1[2].trim(),
        meanings: m1[3].split(/[;；,，]/).map(s => s.trim()).filter(Boolean),
      };
    }

    // Pattern 2: word n./v./adj. meaning
    if (!word) {
      const m2 = t.match(/^([a-zA-Z][a-zA-Z\-']*)\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.)\s*(.+)$/);
      if (m2) {
        word = {
          id: uuidv4(), word: m2[1].trim().toLowerCase(),
          meanings: [`${m2[2]} ${m2[3].trim()}`],
        };
      }
    }

    // Pattern 3: word  meaning (2+ spaces)
    if (!word) {
      const m3 = t.match(/^([a-zA-Z][a-zA-Z\-']*)\s{2,}(.+)$/);
      if (m3) {
        const w = m3[1].trim().toLowerCase();
        const me = m3[2].trim();
        if (w.length > 1 && me.length > 0 && !/^\d+$/.test(w)) {
          word = { id: uuidv4(), word: w, meanings: me.split(/[;；,，]/).map(s => s.trim()).filter(Boolean) };
        }
      }
    }

    // Pattern 4: single word
    if (!word) {
      const m4 = t.match(/^([a-zA-Z][a-zA-Z\-']{2,})$/);
      if (m4) {
        word = { id: uuidv4(), word: m4[1].trim().toLowerCase(), meanings: ['(释义待确认)'] };
      }
    }

    if (word && word.word.length >= 2) words.push(word);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = words.filter(w => { if (seen.has(w.word)) return false; seen.add(w.word); return true; });
  return { words: unique, totalCount: unique.length };
}
