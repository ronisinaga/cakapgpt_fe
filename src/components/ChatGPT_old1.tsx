// src/components/ChatChatGPT.tsx
import React, { useEffect, useRef, useState } from "react"
import { Send, StopCircle } from "react-feather"
import type { Message } from '../types/message'
//import MarkdownRenderer from "./MarkdownRenderer"
import ChatInput from "./ChatInput";
import ChatBubble from "./ChatBubble";



export default function ChatGPT() {
  //const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  //const [messages, setMessages] = useState([{ sender: "ai", text: "" }]);
  const [isStreaming, setIsStreaming] = useState(false);
  const evtRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // helper id
  const makeId = () => Math.random().toString(36).slice(2, 9);

  // auto scroll to bottom
  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // start streaming for a prompt
  const startStream = (prompt: string) => {
    process(prompt)
  }

  // send handler
  /*const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    startStream(trimmed);
    setInput("");
  };*/

  // stop streaming
  const stopStream = () => {
    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }
    // mark any streaming messages as finished
    setMessages((arr) => arr.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    setIsStreaming(false);
  };

  const writeToPage = (prompt: string, history: any[]) => {
    const userMsg: Message = { id: makeId(), role: "user", text: prompt, time: new Date().toLocaleTimeString() };
    setMessages((s) => [...s, userMsg]);

    const botId = makeId();
    const botMsg: Message = { id: botId, role: "bot", text: "", streaming: true, time: new Date().toLocaleTimeString() };
    setMessages((s) => [...s, botMsg]);
    setIsStreaming(true);

    // ✅ Pakai fetch dengan POST, lalu baca stream manual
    const controller = new AbortController();
    evtRef.current = null;

    const timeout = setTimeout(() => {
      controller.abort();
      setMessages((arr) =>
        arr.map((m) => m.id === botId ? { ...m, streaming: false } : m)
      );
      setIsStreaming(false);
    }, 60000);

    fetch("http://localhost:8000/api/v1/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history }),
      signal: controller.signal,
    })
    .then(res => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            clearTimeout(timeout);
            setMessages((arr) =>
              arr.map((m) => m.id === botId ? { ...m, streaming: false } : m)
            );
            setIsStreaming(false);
            return;
          }

          console.log("VALUE:"+value)

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            console.log(line)
            if (line.startsWith("data: ")) {
              //const data = line.replace("data: ", "").trim();
              let data = line.slice(6)
              data = data.replace(/\r|(\[DONE\])/g, '');
              if (data === "[DONE]") {
                clearTimeout(timeout);
                setMessages((arr) =>
                  arr.map((m) => m.id === botId ? { ...m, streaming: false } : m)
                );
                setIsStreaming(false);
                return;
              }
              if (data !== "") {
                setMessages((arr) =>
                  arr.map((m) => m.id === botId ? { ...m, text: m.text + data } : m)
                );
              }
            }
          }
          read();
        });
      };
      read();
    })
    .catch(err => {
      clearTimeout(timeout);
      console.log("Fetch error:", err);
      setMessages((arr) =>
        arr.map((m) => m.id === botId ? {
          ...m,
          streaming: false,
          text: m.text.trim() === "" ? "Maaf, koneksi terputus. Silakan coba lagi." : m.text
        } : m)
      );
      setIsStreaming(false);
  });
};

const LLM = async (prompt: string) => {
  const history = messages
    .filter(m => !m.streaming && m.text.trim() !== "")
    .map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text
    }));

  writeToPage(prompt, history);
};

  const process = (prompt:string)=>{
    LLM(prompt)
  }

  return (
    <div className="flex flex-col h-full max-h-screen bg-white border rounded-lg shadow overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <img
            src="/assets/cakapgpt.jpg" 
            alt="CakapGPT Logo"
            className="w-20 h-10 object-contain rounded-md"
          />
          <div className="text-sm font-semibold">Smart AI Conversation with CakapGPT</div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <button onClick={stopStream} className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition">
              <StopCircle size={16} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-2 bg-[rgb(247,247,250)]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">Ask Everything that you want to know to CakapGPT</div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="w-full">
            <ChatBubble m={m} />
              {m.role === "bot" && m.streaming && (
                <div className="flex justify-start mb-4 pl-1">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-400 animate-pulse">▍</div>
                </div>
            )}
          </div>
        ))}
      </div>

      {/* input */}
      <ChatInput
        onSend={(text) => startStream(text)}
        isStreaming={isStreaming}
      />
    </div>
  );
}