import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// --- Types ---
type Segment =
  | { type: "text"; content: string }
  | { type: "math"; content: string; display: boolean };

// --- Parser ---
function parseMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const isBlock = match[0].startsWith("\\[");
    segments.push({
      type: "math",
      content: match[1] ?? match[2],
      display: isBlock,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

// --- Sub-components ---
interface MathSegmentProps {
  content: string;
  display: boolean;
}

function MathSegment({ content, display }: MathSegmentProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(content, ref.current, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [content, display]);

  return <span ref={ref} />;
}

// --- Main Component ---
interface MathRendererProps {
  text: string;
}

export default function LatexRenderer({ text }: MathRendererProps) {
  const segments = parseMathSegments(text);

  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.content}</span>
        ) : (
          <MathSegment key={i} content={seg.content} display={seg.display} />
        )
      )}
    </div>
  );
  <div  className="prose max-w-none">
    <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
    >
    </ReactMarkdown>
    </div>
}