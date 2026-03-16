import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Grid, HelpCircle, Folder } from "react-feather";
import ChatGPT from "../components/ChatGPT";

const Home = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const streamingBuffer = useRef("");

  const MIN_WIDTH = 60;
  const MAX_WIDTH = 550;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) navigate("/linear", { state: { question: input } });
  };

  const startDragging = () => !isCollapsed && setIsDragging(true);
  const stopDragging = () => setIsDragging(false);
  const [message, setMessage] = useState([{ sender: "ai", text: "" }]);
  const lastUpdate = useRef(Date.now());
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [rightWidth, setRightWidth] = useState(280);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">

      {/* HEADER */}
      <header className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer select-none">
          <Menu
            size={22}
            className="opacity-70 hover:opacity-100 transition"
            onClick={() => setIsCollapsed(!isCollapsed)}
          />

          {/* LOGO + TEXT */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.jpg"
              alt="OKAPP Logo"
              className="h-10 w-auto object-contain"
            />

            {!isCollapsed && (
              <span className="font-bold text-xl text-gray-800 tracking-wide">
                - Mini AI
              </span>
            )}
          </div>
        </div>
        <p className="text-sm opacity-50">v1.0</p>
      </header>

      {/* LAYOUT */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside
          className="bg-white border-r border-gray-200 shadow-sm  transition-all duration-200 flex flex-col"
          style={{ width: isCollapsed ? 60 : sidebarWidth }}
        >
          <div className="px-4 py-5">
            {!isCollapsed && <h2 className="font-semibold text-lg mb-4">Menu</h2>}

            <ul className="space-y-4">
              {[
                { label: "Persamaan Linear", icon: Grid },
                { label: "Optimasi", icon: Folder },
                { label: "Machine Learning", icon: HelpCircle },
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 cursor-pointer hover:text-black text-gray-700 text-[15px]"
                >
                  <item.icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* RESIZER (only active if expanded) */}
        {!isCollapsed && (
          <div
            className="w-1 cursor-col-resize hover:bg-gray-400 bg-gray-300 transition"
            onMouseDown={startDragging}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto p-6"><ChatGPT /></div>
        {/* RIGHT SIDEBAR */}
        <aside
          className="bg-white border-l border-gray-200 shadow-sm transition-all duration-200 flex flex-col"
          style={{ width: isRightCollapsed ? 60 : rightWidth }}
        >

          {/* HEADER SIDEBAR KANAN */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isRightCollapsed && <h2 className="font-semibold text-lg">Founder</h2>}
            
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="p-2 rounded hover:bg-gray-100"
            >
              {isRightCollapsed ? "›" : "‹"}
            </button>
          </div>

          {/* KONTEN SIDEBAR */}
          {!isRightCollapsed && (
            <div className="flex-1 overflow-auto p-4 text-sm text-gray-700 space-y-6">

              <section className="text-center">
                <h3 className="font-medium mb-2">Roni Fitriandi Sinaga</h3>

                <img 
                  src="/assets/foto3x4.jpg" 
                  alt="Founder" 
                  className="w-32 h-auto mx-auto rounded-lg border shadow-md"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Mahasiswa S2 Universitas Pamulang
                </p>
              </section>
            </div>
          )}

        </aside>
      </div>

      {/* FOOTER */}
      <footer className="h-12 border-t bg-white flex items-center justify-center text-sm text-gray-500">
        © {new Date().getFullYear()} — Dibuat Oleh Roni F Sinaga untuk mengimplementasikan materi S2 dengan ❤️
      </footer>
    </div>
  );
};

export default Home;
