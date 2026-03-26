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

  const writeToPage = (prompt:string, url:string) =>{
    // push user message
    const userMsg: Message = { id: makeId(), role: "user", text: prompt, time: new Date().toLocaleTimeString() };
    setMessages((s) => [...s, userMsg]);

    // add placeholder bot message
    const botId = makeId();
    const botMsg: Message = { id: botId, role: "bot", text: "", streaming: true, time: new Date().toLocaleTimeString() };
    setMessages((s) => [...s, botMsg])

    const es = new EventSource(url, { withCredentials: false })
    evtRef.current = es
    setIsStreaming(true)

    es.onopen = () => {
      // console.log("SSE open");
    };

    //Timeout fallback - jika 30 detik tidak ada [DONE]
    const timeout = setTimeout(() => {
      console.log("SSE timeout - forcing streaming to false");
      setMessages((arr) =>
        arr.map((m) => m.id === botId ? { ...m, streaming: false } : m)
      );
      setIsStreaming(false);
      es.close();
      evtRef.current = null;
    }, 30000);

    es.onmessage = (e) => {
      let data = e.data
      if (!data) return

      // sentinel for end of stream
      data = data.replace(/<think>[\s\S]*?<\/think>/g, '');
      if (data === "[DONE]") {
        clearTimeout(timeout);
        // finalize: remove streaming flag
        setMessages((arr) => arr.map(m => m.id === botId ? { ...m, streaming: false } : m));
        setIsStreaming(false);
        es.close();
        evtRef.current = null;
        return;
      }
      console.log("DATA:", JSON.stringify(data));

      // append chunk to bot message
      data = data.replace(/\n\n+/g, "\n");
      data = data.replace(/\n{2,}/g, "\n");
      setMessages((arr) =>
        arr.map((m) => (m.id === botId ? { ...m, text: m.text + data } : m))
      );
    };

    es.onerror = (err) => {
      clearTimeout(timeout);
      console.error("SSE Error:", err);
      // mark bot as finished with error flag
      /*setMessages((arr) =>
        arr.map((m) => m.id === botId ? { ...m, streaming: false, text: m.text + " [error]" } : m)
      )*/
      setMessages((arr) =>
        arr.map((m) => m.id === botId ? { 
          ...m, 
          streaming: false, 
          text: m.text.trim() === "" 
          ? "Maaf, koneksi terputus. Silakan coba lagi." 
          : m.text 
        } : m)
      );
      setIsStreaming(false)
      es.close()
      evtRef.current = null
    }
  }

  const LLM = async(prompt:string)=>{

    try{
      //Ambil history dari messages yang sudah ada
      const history = messages
        .filter(m => !m.streaming && m.text.trim() !== "" && m.role === "user")
        .map(m => ({
          role: "user" as const,
          content: m.text
      }));
      const url = `http://localhost:8000/api/v1/chat/stream?prompt=${encodeURIComponent(prompt)}&history=${encodeURIComponent(JSON.stringify(history))}`
      //const url = `/api/v1/chat/stream?prompt=${encodeURIComponent(prompt)}&history=${encodeURIComponent(JSON.stringify(history))}`
      writeToPage(prompt,url)

    }catch(error){
      console.log("Error:",error)
    }
  }

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