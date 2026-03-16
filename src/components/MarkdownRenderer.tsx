//import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useMemo,useState, useEffect } from "react";

interface Props {
  content: string;
}

function normalizeMarkdown_old(text: string) {
  return text
    .replace(/•\s*/g, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    // Convert \[...\] ke $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$$\n$1\n$$$$")
    // Convert \(...\) ke $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$")
    // Escape | di dalam formula $ $
    .replace(/\$([^$]*)\|([^$]*)\$/g, "$$$1\\|$2$$")
    // Fix: teks yang diakhiri $$ tapi tidak diawali $$
    .replace(/(^|\n)([^$\n][^\n]*?[^$])\$\$(\n|$)/g, "$1\$\$$2\$\$$3")
    // Fix: $$formula tanpa penutup → $$formula$$
    .replace(/\$\$((?:[^$]|\n(?!\n))+?)(?=\n\n|$)/g, (_, content) => `$$${content}$$`)
    // Fix: angka$ → angka (hapus $ simbol mata uang setelah angka)
    .replace(/(\d)\$(?!\$)/g, "$1");
}

function normalizeMarkdown_old1(text: string) {
  return text
    .replace(/•\s*/g, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$$\n$1\n$$$$")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$")
    // Fix: **teks $x** → **teks x** (hapus $ yang nyasar di dalam bold)
    .replace(/(\*\*[^*]*?)\$([^*]*?\*\*)/g, "$1$2")
    // Fix: kalau ada $$ penutup, pastikan pembukaannya juga $$
    .replace(/(?<!\$)\$((?:[^$]|\n)+?)\$\$/g, (_, content) => `$$${content}$$`)
    .replace(/(^|\n)([^$\n][^\n]*?[^$])\$\$(\n|$)/g, "$1\$\$$2\$\$$3")
    // Fix: $$formula tanpa penutup → $$formula$$
    .replace(/\$\$((?:[^$]|\n(?!\n))+?)(?=\n\n|$)/g, (_, content) => `$$${content}$$`)
    // Fix: angka$ → angka (hapus $ simbol mata uang setelah angka)
    .replace(/(\d)\$(?!\$)/g, "$1");
}

function normalizeMarkdown_old2(text: string) {
  const result = text
    .replace(/•\s*/g, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$$\n$1\n$$$$")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$")
    // Fix: baris yang mengandung LaTeX command tapi tidak ada delimiter
    .replace(/^(?!\s*\$\$)(\s*\\[a-zA-Z]+.*)$/gm, (match) => {
      // Skip kalau sudah punya delimiter
      if (match.includes("$$") || match.includes("\\[") || match.includes("\\(")) {
        return match;
      }
      return `$$${match.trim()}$$`;
    })
    // Fix: pastikan $$ selalu dikelilingi newline agar bold di baris lain tidak pecah
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => `\n$$${content}$$\n`);

    console.log("Normalized",result);
    return result;
}

function normalizeMarkdown(text: string) {
  let result = text
    .replace(/•\s*/g, "- ")
    .replace(/<br\s*\/?>/gi, "\n");

  // Konversi \[...\] ke $$ block dengan newline di dalam
  result = result.replace(/[ \t]*\\\[([\s\S]*?)\\\]/g, (_, content) => {
    return `\n\n$$\n${content.trim()}\n$$\n\n`;
  });

  // Konversi \(...\) ke $...$ inline
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => {
    return `$${content.trim()}$`;
  });

  // Bersihkan newline berlebihan
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}


export default function MarkdownRenderer({ content }: Props) {
  console.log(normalizeMarkdown(content))
  const debouncedContent = useDebounce(content, 10);
  return (
    <div  className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeMarkdown(debouncedContent)}
      </ReactMarkdown>
    </div>
  );
}
