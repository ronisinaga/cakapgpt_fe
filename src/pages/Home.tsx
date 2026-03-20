import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Grid, HelpCircle, Type, FileText, Globe, MessageSquare, BarChart2, Layers, Award } from "react-feather";
import ChatGPT from "../components/ChatGPT";


const Home = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuTree = [
    {
      key: "llm",
      label: "Large Language Model (LLM)",
      icon: Grid,
      children: [
        { label: "CakapGPT", image: "/assets/cakapgpt.jpg" },
      ],
    },
    {
      key: "ml",
      label: "Machine Learning",
      icon: HelpCircle,
      children: [
        
      ],
    },
  ];

  type MenuItem = {
    key: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: {
      label: string;
      image: string; // ← ganti dari icon ke image
    }[];
  };

  const MIN_WIDTH = 60;
  const MAX_WIDTH = 550;

  const startDragging = () => !isCollapsed && setIsDragging(true);
  const stopDragging = () => setIsDragging(false);
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
                - Large Language Model (LLM) & Machine Learning Application
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

            <ul className="space-y-1">
              {menuTree.map((item) => (
                <li key={item.key}>
                  {/* Parent item */}
                  <div
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 text-gray-700 text-[14px] select-none"
                    onClick={() => toggleMenu(item.key)}
                  >
                    <item.icon size={18} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>

                        {/* Badge jumlah children */}
                        <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 leading-none">
                          {item.children.length}
                        </span>

                        {/* Chevron */}
                        <span
                          className="text-gray-400 text-xs transition-transform duration-200 ml-1"
                          style={{
                            display: "inline-block",
                            transform: openMenus[item.key] ? "rotate(90deg)" : "rotate(0deg)",
                          }}
                        >
                          ›
                        </span>
                      </>
                    )}
                  </div>

                  {/* Children */}
                  {!isCollapsed && openMenus[item.key] && (
                    <ul className="ml-5 border-l border-gray-200 pl-2 mt-1 space-y-1">
                      {item.children.map((child, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 text-gray-600 text-[13px]"
                        >
                          <img
                            src={child.image}
                            alt={child.label}
                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                          />
                          {child.label}
                        </li>
                      ))}
                    </ul>
                  )}
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
