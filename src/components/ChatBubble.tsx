import React from "react";
import type { Message } from "../types/message";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatBubbleProps {
  m: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = React.memo(({ m }) => {
  const isUser = m.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`
          w-full max-w-[80%] rounded-xl p-4 shadow
          ${isUser ? "bg-black text-white" : "bg-white text-gray-900"}
        `}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm text-white break-words text-right">
            {m.text}
          </div>
        ) : (
          <MarkdownRenderer content={m.text} isStreaming={m.streaming ?? false} />
        )}
        <div className="text-xs opacity-60 mt-2 text-right">
          {m.time}
        </div>
      </div>
    </div>
  );
});

export default ChatBubble;