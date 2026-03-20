import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Grid,Airplay,BarChart} from "react-feather";
import ChatGPT from "../components/ChatGPT";


const Home = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  // Tambahkan state ini di dalam komponen Home
  const [activeMenu, setActiveMenu] = useState<string>("cakapgpt"); // default CakapGPT
  
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuTree = [
    {
      key: "llm",
      label: "Large Language Model (LLM)",
      icon: Grid,
      children: [
        { label: "CakapGPT", image: "/assets/cakapgpt.jpg", key: "cakapgpt" },
      ],
    },
    {
      key: "ml",
      label: "Machine Learning",
      icon: BarChart,
      children: [],
    },
    {
      key: "dl",
      label: "Deep Learning",
      icon: Airplay,
      children: [],
    },
  ];

  type MenuItem = {
    key: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: {
      label: string;
      image: string;
      key: string;
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
                - Large Language Model (LLM), Machine Learning and Deep Learning Application
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
                          onClick={() => setActiveMenu(child.key)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px]
                          ${activeMenu === child.key
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "hover:bg-gray-100 text-gray-600"
                          }`}
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
        <div className="flex-1 overflow-auto p-6">
          {activeMenu === "cakapgpt" && <ChatGPT />}
          {activeMenu === "" && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Pilih menu untuk memulai
            </div>
          )}
        </div>
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

              {/* Foto & Nama */}
              <section className="text-center">
                <img
                  src="/assets/foto3x4.jpg"
                  alt="Founder"
                  className="w-24 h-24 mx-auto rounded-full border-4 border-blue-100 shadow-md object-cover"
                />
                <h3 className="font-semibold text-base mt-3 text-gray-800">Roni Fitriandi Sinaga</h3>
                <p className="text-xs text-blue-500 font-medium mt-1">AI & Machine Learning Enthusiast</p>
                <p className="text-xs text-gray-400 mt-0.5">Magister Student at Pamulang University (Universitas Pamulang)</p>
              </section>

              {/* Divider */}
              <hr className="border-gray-10" />

              {/* Bio */}
              <section className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 mt-0.5">
                    AI
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Has a lot of interest in{" "}
                    <span className="font-medium text-gray-800">AI</span>,{" "}
                    <span className="font-medium text-gray-800">Machine Learning</span>, and{" "}
                    <span className="font-medium text-gray-800">Deep Learning</span> and tries to
                    implement them into applications that can help people understand them.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0 mt-0.5">
                    ERP
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Also has advanced knowledge in{" "}
                    <span className="font-medium text-gray-800">ERP (Enterprise Resource Planning)</span>.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-[11px] text-white flex-shrink-0 mt-0.5">
                    🤝
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Happy to collaborate with people in developing AI, Machine Learning, and Deep
                    Learning applications.
                  </p>
                </div>
              </section>

              {/* Divider */}
              <hr className="border-gray-10" />

              {/* Contact */}
              <section>
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Contact</p>
                
                <a href="mailto:dragonif01@gmail.com"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition text-blue-600 text-xs font-medium"
                >
                  <span>✉️</span>
                  dragonif01@gmail.com
                </a>
              </section>
            </div>
          )}

        </aside>
      </div>

      {/* FOOTER */}
      <footer className="h-12 border-t bg-white flex items-center justify-center text-sm text-gray-500">
        © {new Date().getFullYear()} — Developed by Roni Fitriandi Sinaga to implement knowledge and experience in AI, Machine Learning and Deep Learning ❤️
      </footer>
    </div>
  );
};

export default Home;
