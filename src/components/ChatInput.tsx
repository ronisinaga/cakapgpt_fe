import React, { useState } from "react";
import { Send } from "react-feather";

interface ChatInputProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({ onSend, isStreaming }) => {
  const [input, setInput] = useState("");

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <form onSubmit={handleSend} className="flex items-center w-full p-4 border-t bg-white">
      <div className="flex items-center w-full border rounded-full px-4 py-2 shadow-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your discussion..."
          className="flex-1 resize-none outline-none bg-transparent p-2"
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          <Send size={16} />
          <span className="text-sm">Send</span>
        </button>
      </div>
    </form>
  );
});

export default ChatInput;