import React, { useState } from "react";
import { Sun, Moon, PanelLeft, Sparkles, Download, Zap, RefreshCw, ChevronDown, Code, Globe, Palette, Brain } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  onExportChat?: () => void;
  onNewChat?: () => void;
  selectedPersona?: string;
  onSelectPersona?: (persona: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onExportChat,
  onNewChat,
  selectedPersona = "auto",
  onSelectPersona,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const personas = [
    { id: "auto", name: "Afridi-GPT Pro (Auto)", icon: <Zap className="h-3.5 w-3.5 text-emerald-400" /> },
    { id: "coder", name: "Software Engineer", icon: <Code className="h-3.5 w-3.5 text-cyan-400" /> },
    { id: "researcher", name: "Web Researcher", icon: <Globe className="h-3.5 w-3.5 text-blue-400" /> },
    { id: "designer", name: "AI Art & UI Designer", icon: <Palette className="h-3.5 w-3.5 text-purple-400" /> },
    { id: "reasoner", name: "Deep Logic & Math", icon: <Brain className="h-3.5 w-3.5 text-amber-400" /> },
  ];

  const currentPersonaObj = personas.find((p) => p.id === selectedPersona) || personas[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-chat-border-dark/80 bg-white/80 dark:bg-chat-bg-dark/80 px-4 sm:px-6 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Afridi-GPT Glowing Brand Badge */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
            <Zap className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent tracking-wide">
            Afridi-GPT
          </span>
          <span className="hidden sm:inline-block rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            v3.5 Pro
          </span>
        </div>

        {/* AI Persona Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all"
          >
            {currentPersonaObj.icon}
            <span className="hidden md:inline">{currentPersonaObj.name}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl z-50 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select AI Persona
              </div>
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (onSelectPersona) onSelectPersona(p.id);
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all text-left ${
                    selectedPersona === p.id
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.icon}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Active Online Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Real-time Active</span>
        </div>

        {/* New Chat Quick Action */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Start new chat"
          >
            <RefreshCw className="h-3.5 w-3.5 text-chat-accent" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}

        {/* Export Chat Button */}
        {onExportChat && (
          <button
            onClick={onExportChat}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            title="Export conversation history"
          >
            <Download className="h-4 w-4" />
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
