import React from "react";
import { Sun, Moon, PanelLeft, Sparkles, LogOut, User as UserIcon, LogIn } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenAuthModal }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

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
          <span>GPT-5.4 Mini</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
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

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.name}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
