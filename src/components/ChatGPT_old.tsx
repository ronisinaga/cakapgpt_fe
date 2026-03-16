// src/components/ChatChatGPT.tsx
import React, { useEffect, useRef, useState } from "react";
import { Send, StopCircle } from "react-feather";
import type { Message } from '../types/message';
import type { Equation } from '../types/linear';
import axios from "axios";


export default function ChatGPT() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  //const [messages, setMessages] = useState([{ sender: "ai", text: "" }]);
  const [isStreaming, setIsStreaming] = useState(false);
  const evtRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastUpdate = useRef(Date.now());
  const streamingBuffer = useRef("");
  const [choice, setChoice] = useState("");
  const [sessionle,setSessionLE] = useState("")
  const [methodle,setMethodLE] = useState("")
  const [equation, setEquation] = useState<Equation[]>([]);
  const [sessionop,setSessionOp] = useState("")
  const [sessionllm,setSessionLLM] = useState("")
  const [fungsikendala,setFungsiKendala] = useState("")

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

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/api/v1/welcome");

    eventSource.onopen = () => {
    console.log("SSE Connected!");
    };
    
    eventSource.onmessage = (event) => {
    if (event.data !== "[DONE]"){
        streamingBuffer.current += event.data
        if (Date.now() - lastUpdate.current > 50) {
        lastUpdate.current = Date.now();
        const botId = makeId();
        setMessages(prev => {
                const updated = [...prev];

                // Jika AI belum punya bubble → buat dulu
                if (updated.length === 0) {
                updated.push({
                    id: botId,
                    role: "bot",
                    text: streamingBuffer.current,
                    streaming: true, 
                    time: new Date().toLocaleTimeString()
                });
                } else {
                // Update bubble terakhir (TIDAK push baru)
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    text: streamingBuffer.current
                };
                }

                return updated;
        })
        //const botMsg: Message = { id: botId, role: "bot", text: streamingBuffer.current, streaming: true, time: new Date().toLocaleTimeString() };
        //setMessages((s) => [...s, botMsg]);
        }
    }
    console.log("Received:", event.data); // cek di browser console
    //setMessage(prev => prev + event.data);
    }

    eventSource.onerror = (e) => {
    console.error("SSE Error:", e)
    eventSource.close()
    }

    return () => eventSource.close()
  }, [])

  // start streaming for a prompt
  const startStream = (prompt: string) => {
    process(prompt)
  }

  // send handler
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    startStream(trimmed);
    setInput("");
  };

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

  // simple bubble component
  const Bubble: React.FC<{ m: Message }> = ({ m }) => {
    const isUser = m.role === "user";
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`${isUser ? "bg-black text-white" : "bg-gray-100 text-gray-900"} max-w-[80%] p-4 rounded-xl leading-relaxed whitespace-pre-wrap`}>
          <pre className="whitespace-pre-wrap font-mono text-sm">{m.text || (m.streaming ? "" : "")}</pre>
          <div className="text-xs opacity-60 mt-2 text-right">{m.time}</div>
        </div>
      </div>
    );
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

    es.onmessage = (e) => {
      let data = e.data
      if (!data) return

      // sentinel for end of stream
      if (data === "[DONE]") {
        // finalize: remove streaming flag
        setMessages((arr) => arr.map(m => m.id === botId ? { ...m, streaming: false } : m));
        setIsStreaming(false);
        es.close();
        evtRef.current = null;
        return;
      }

      // append chunk to bot message
      data = data.replace(/\n\n+/g, "\n");
      data = data.replace(/\n{2,}/g, "\n");
      setMessages((arr) =>
        arr.map((m) => (m.id === botId ? { ...m, text: m.text + data } : m))
      );
    };

    es.onerror = (err) => {
      console.error("SSE Error:", err);
      // mark bot as finished with error flag
      setMessages((arr) =>
        arr.map((m) => m.id === botId ? { ...m, streaming: false, text: m.text + " [error]" } : m)
      )
      setIsStreaming(false)
      es.close()
      evtRef.current = null
    }
  }

  const resetAction = () =>{
    setChoice("")
    setSessionLE("")
    setMethodLE("")
    setSessionLLM("")
  }

  const sendChoice = (prompt:string) =>{
    if(!isNaN(Number(prompt))){
        setChoice(prompt)
    }
    const url = `http://localhost:8000/api/v1/chat?input=${encodeURIComponent(prompt)}`
    writeToPage(prompt,url)
  }

  const linearEquation = async (prompt:string)=>{
    //const eq = convertToArray(prompt)
    if (sessionle == ""){
        //return `http://localhost:8000/api/v1/linear`
        linearFormat(prompt)
        
    }else{
      if (methodle == ""){
        linearSolution(sessionle,prompt)
        resetAction()
      }else{
        linearDetail(sessionle,methodle,prompt)
      }
    }
  }

  const linearDetail = async (session:string, method:string,prompt:string) =>{

  }
  const linearSolution = async(session:string,prompt:string) => {
    try{
      const url = `http://localhost:8000/api/v1/linearsolution?session=${session}&method=${prompt}`
      writeToPage(prompt,url)
      setMethodLE(prompt)
    }
    catch(error){
      console.log(error)
    }
  }

  const linearFormat = async(prompt:string) => {
    try{
      const response = await axios.post("http://localhost:8000/api/v1/linsession", {
        "texts":prompt,
      })
      setSessionLE(response.data)
      console.log("session id:"+sessionle)
      const url = `http://localhost:8000/api/v1/linearequation?session=${response.data}`
      writeToPage(prompt,url)
      console.log("response:",response.data)

    }catch(error){
      console.log("Error:",error)
    }
  }

  const optimization = (prompt:string) =>{
    if (sessionop == ""){
        //return `http://localhost:8000/api/v1/linear`
        initOptimization(prompt)
        
    }else{
      if (fungsikendala == ""){
        fungsiKendala(prompt)
      }else{
        optimizationSolution(prompt)
      }
    }
  }

  const initOptimization = async (prompt:string) => {
    try{
      const response = await axios.post("http://localhost:8000/api/v1/optsession", {
        "texts":prompt,
      },
      {
            withCredentials: true,
            headers: { "Content-Type": "application/json"}
      })
      setSessionOp(response.data)
      console.log("session id:"+sessionle)
      const url = `http://localhost:8000/api/v1/objective?session=${response.data}`
      writeToPage(prompt,url)
      console.log("response:",response.data)

    }catch(error){
      console.log("Error:",error)
    }
  }

  const fungsiKendala = async (prompt:string) =>{
    try{
      const response = await axios.post("http://localhost:8000/api/v1/sessionkendala", {
        "texts":prompt,
      })
      setFungsiKendala(response.data)
      console.log("session id:"+fungsikendala)
      const url = `http://localhost:8000/api/v1/fungsikendala?session=${response.data}`
      writeToPage(prompt,url)
      console.log("response:",response.data)

    }catch(error){
      console.log("Error:",error)
    }
  }

  const optimizationSolution = async(prompt:string) =>{
    const url = `http://localhost:8000/api/v1/soloptimization?sessionOb=${sessionop}&sessionK=${fungsikendala}&prompt=${prompt}`
      writeToPage(prompt,url)
  }

  const Experiment = async(prompt:string) => {
    initExperiment(prompt)
  }

  const initExperiment = async(prompt:string) => {
    try{
      const url = `http://localhost:8000/api/v1/experiment`
      writeToPage(prompt,url)

    }catch(error){
      console.log("Error:",error)
    }
  }

  const LLM = async(prompt:string)=>{

    if (sessionllm == ""){
      try{
        const url = `http://localhost:8000/api/v1/chat/start`
        writeToPage(prompt,url)
        setSessionLLM("chat")

      }catch(error){
        console.log("Error:",error)
      }
    }else{
      try{
        const url = `http://localhost:8000/api/v1/chat/stream?prompt=${prompt}`
        writeToPage(prompt,url)

      }catch(error){
        console.log("Error:",error)
      }
    }
  }

  const process = (prompt:string)=>{
    if (choice == ""){
        sendChoice(prompt)
    }else{
        if (choice == '1'){
          linearEquation(prompt)
        }else if(choice == '2'){
          optimization(prompt)
        }else if(choice == '3'){

        }else if(choice == '4'){
          Experiment(prompt)
        }else if (choice == '5'){
          LLM(prompt)
        }
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen bg-white border rounded-lg shadow overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.jpg" 
            alt="OKAPP Logo"
            className="w-20 h-10 object-contain rounded-md"
          />
          <div className="text-sm font-semibold">Tuliskan permasalahanmu, OKAPP akan menyelesaikannya</div>
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
          <div className="text-center text-gray-500 mt-8">Tanyakan sesuatu — contohnya: <span className="font-mono">2x + y = 5</span></div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="w-full">
            <Bubble m={m} />
            {/* typing cursor for streaming bot */}
            {m.role === "bot" && m.streaming && (
              <div className="flex justify-start mb-4 pl-1">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-400 animate-pulse">▍</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* input */}
      <form onSubmit={handleSend} className="flex items-center w-full p-4 border-t bg-white">
        <div className="flex items-center w-full border rounded-full px-4 py-2 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan..."
            className="flex-1 resize-none outline-none bg-transparent p-2"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              <Send size={16} />
              <span className="text-sm">Kirim</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
