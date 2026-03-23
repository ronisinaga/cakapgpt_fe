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

  //Hapus backtick yang membungkus ekspresi math
  // Contoh: `$v_f \approx 93.56$` → \(v_f \approx 93.56\)
  result = result.replace(/`(\$[^`]+\$)`/g, (_, content) => {
    // Hapus $ di awal dan akhir lalu bungkus dengan \(...\)
    const inner = content.replace(/^\$|\$$/g, "").trim();
    return `\\(${inner}\\)`;
  });

  //Hapus backtick yang membungkus LaTeX tanpa $
  // Contoh: `v_f \approx 93.56 \, \text{m/s}` → \(v_f \approx 93.56\)
  result = result.replace(/`([^`]*\\[a-zA-Z][^`]*)`/g, (_, content) => {
    return `\\(${content.trim()}\\)`;
  });

  //Hapus backtick yang mengandung $ atau \
  result = result.replace(/`([^`]*(?:\$|\\)[^`]*)`/g, (_, content) => {
    const converted = content.replace(
      /\$([^$]+)\$/g,
      (_: string, inner: string) => `\\(${inner}\\)`
    );
    return converted;
  });

  //Hapus * di awal baris yang bukan list
  result = result.replace(/^\*(?!\s*[\*\-\s])\s*/gm, "");

  //Hapus backtick yang membungkus teks biasa + math campuran
  result = result.replace(/^`([^`]+)`$/gm, (_, content) => {
    const hasNormalText = /[a-zA-Z\s]{3,}/.test(content);
    if (hasNormalText) return content;
    return `\`${content}\``;
  });

  // Konversi $...$ ke \(...\) SEBELUM ekstrak math blocks
  // Skip $$ dan angka setelah $ (mata uang)
  result = result.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (match, content) => {
    if (/^\d/.test(content.trim())) return match;
    return `\\(${content}\\)`;
  });

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

  // Konversi **Heading:** menjadi ### Heading
  result = result.replace(/^\*\*([^*\n]+):\*\*$/gm, (_, content) => {
    return `### ${content}:`;
  });
  result = result.replace(/^\*\*([^*\n]+):\*\*\s+/gm, (_, content) => {
    return `### ${content}:\n`;
  });

  // Hapus bold yang membungkus seluruh kalimat panjang
  result = result.replace(/\*\*([^*\n]+)\*\*/g, (match, content) => {
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 8) return content;
    return match;
  });

  //Hapus LaTeX di dalam sel tabel SETELAH math diekstrak
  // Sehingga hanya LaTeX yang tersisa di tabel yang dibersihkan
  result = result.replace(/^\|.+\|$/gm, (row) => {
    return row
      .replace(/\\\(|\\\)|\\\[|\\\]/g, "")  // hapus delimiter LaTeX
      .replace(/\\_/g, "_")                  // hapus escape underscore
      .replace(/\\([a-zA-Z])/g, "$1");       // hapus backslash sebelum huruf
  });

  // Pisahkan teks: | tabel → teks\n\n| tabel
  result = result.replace(
    /^([^|]+):\s*(\|.+)$/gm,
    (_, textBefore, tableRow) => {
      return `${textBefore.trim()}:\n\n${tableRow.trim()}`;
    }
  );

  //FIX: Pastikan ada baris kosong antara teks/label dan baris tabel pertama
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

  const boldMatches = result.match(/\*\*[^*\n]+\*\*/g);
  if (boldMatches) console.log("BOLD:", JSON.stringify(boldMatches));

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
        components={{
          h2: ({ children }: any) => (
            <h2 style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 16,
              marginBottom: 6,
              color: "#111"
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3 style={{
              fontSize: 15,
              fontWeight: 600,
              marginTop: 12,
              marginBottom: 4,
              color: "#111"
            }}>
              {children}
            </h3>
          ),
          // ... komponen lainnya
        }}
      >
        {normalizeMarkdown(debouncedContent)}
      </ReactMarkdown>
    </div>
  );
}