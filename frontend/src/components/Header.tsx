import React from "react";
import { Sun, Moon, PanelLeft, Sparkles, Activity } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 dark:border-chat-border-dark bg-white/80 dark:bg-chat-bg-dark/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Model Badge */}
        <div className="flex items-center gap-2 rounded-full border border-chat-accent/30 bg-chat-accent/10 px-3 py-1 text-xs font-semibold text-chat-accent shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Claude 3.5 Sonnet</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Active & Online</span>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
