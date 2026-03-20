import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useState, useEffect } from "react";

interface Props {
  content: string;
  isStreaming?: boolean;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function normalizeMarkdown(text: string) {
  let result = text
    .replace(/•\s*/g, "- ")
    .replace(/<br\s*\/?>/gi, "\n");

  // Simpan semua block math dulu sebelum diproses
  const mathBlocks: string[] = [];
  const mathInlines: string[] = [];

  // Ekstrak \[...\] supaya | di dalamnya tidak merusak tabel
  result = result.replace(/[ \t]*\\\[([\s\S]*?)\\\]/g, (_, content) => {
    const idx = mathBlocks.length;
    mathBlocks.push(`\n\n$$\n${content.trim()}\n$$\n\n`);
    return `%%MATHBLOCK_${idx}%%`;
  });

  // Ekstrak \(...\) supaya | di dalamnya tidak merusak tabel
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => {
    const idx = mathInlines.length;
    mathInlines.push(`$${content.trim()}$`);
    return `%%MATHINLINE_${idx}%%`;
  });

  // ✅ FIX: Pastikan ada baris kosong antara teks/label dan baris tabel pertama
  // Menangkap kasus: "**Label:**\n| ..." → "**Label:**\n\n| ..."
  result = result.replace(/([^\n])\n(\|)/g, "$1\n\n$2");

  // Hapus baris kosong di dalam blok tabel
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/(\|[^\n]+)\n[ \t]*\n(\|)/g, "$1\n$2");
  }

  // Hapus indentasi di depan baris tabel
  result = result.replace(/^[ \t]+(\|)/gm, "$1");

  // Pastikan ada baris kosong setelah tabel
  result = result.replace(/(\|[^\n]+)\n([^\n|])/g, "$1\n\n$2");

  // ✅ FILTER: Pisahkan baris tabel yang berisi teks panjang (bukan data)
  result = result.replace(/^(\|)(.+)(\|)$/gm, (line) => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    // Cek apakah sel pertama adalah teks panjang (kalimat)
    const firstCell = cells[0] ?? "";
    console.log("Cek first sel\n")
    console.log(firstCell)
    const isSeparatorRow = /^[\s\-:]+$/.test(firstCell);
    const isDataRow = /^[\d\/\.\-\+\s%a-zA-Z_]{0,15}$/.test(firstCell);

    if (!isSeparatorRow && !isDataRow && firstCell.length > 15) {
      // Keluarkan dari tabel, jadikan paragraf biasa
      return `\n${cells.filter(c => c).join(" ")}\n`;
    }
    return line;
  });

  // Bersihkan newline berlebihan
  result = result.replace(/\n{3,}/g, "\n\n");

  // Kembalikan math block
  result = result.replace(/%%MATHBLOCK_(\d+)%%/g, (_, i) => mathBlocks[Number(i)]);
  result = result.replace(/%%MATHINLINE_(\d+)%%/g, (_, i) => mathInlines[Number(i)]);

  return result;
}

export default function MarkdownRenderer({ content }: Props) {
  const debouncedContent = useDebounce(content, 10);
  console.log(content)

  return (
    <div className="prose max-w-none
      [&_table]:border-collapse
      [&_table]:w-full
      [&_table]:text-sm
      [&_th]:border
      [&_th]:border-gray-300
      [&_th]:bg-gray-100
      [&_th]:px-3
      [&_th]:py-2
      [&_th]:text-left
      [&_td]:border
      [&_td]:border-gray-300
      [&_td]:px-3
      [&_td]:py-2
      [&_tr:nth-child(even)]:bg-gray-50
      [&_table]:overflow-x-auto
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeMarkdown(debouncedContent)}
      </ReactMarkdown>
    </div>
  );
}