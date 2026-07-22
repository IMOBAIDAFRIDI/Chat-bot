import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Automatic register/login demo account
      const demoEmail = "demo@example.com";
      const demoPass = "demo123456";
      try {
        await login(demoEmail, demoPass);
      } catch {
        await signup("Demo User", demoEmail, demoPass);
      }
      onClose();
    } catch (err: any) {
      setError("Demo login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-chat-card-dark border border-slate-200 dark:border-chat-border-dark shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError("");
            }}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              isLoginTab
                ? "border-b-2 border-chat-accent text-chat-accent bg-white dark:bg-chat-card-dark"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError("");
            }}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              !isLoginTab
                ? "border-b-2 border-chat-accent text-chat-accent bg-white dark:bg-chat-card-dark"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isLoginTab ? "Welcome back" : "Get started with GPT-5.4"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isLoginTab
              ? "Sign in to access your chat history and custom preferences."
              : "Register a free account to save your AI chats across devices."}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-3 text-sm font-semibold transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {loading ? "Processing..." : isLoginTab ? "Sign In" : "Register"}
            </button>
          </form>

          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-chat-border-dark" />
            <span className="absolute bg-white dark:bg-chat-card-dark px-3 text-xs text-slate-400">
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 text-xs font-semibold transition-colors"
          >
            Use Demo Account (Instant Access)
          </button>
        </div>
      </div>
    </div>
  );
};
