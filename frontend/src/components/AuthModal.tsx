import React, { useState } from "react";
import { X, Mail, KeyRound, User as UserIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { sendOtp, verifyOtp } = useAuth();

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    setLoading(true);

    try {
      const res = await sendOtp(email);
      setStep("otp");
      if (res.devOtpCode) {
        setInfoMsg(`Code sent! (Test OTP: ${res.devOtpCode})`);
      } else {
        setInfoMsg(`Verification code sent to ${email}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyOtp(email, code, name);
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("email");
    setCode("");
    setError("");
    setInfoMsg("");
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

        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chat-accent/10 text-chat-accent mb-4">
            {step === "email" ? <Mail className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {step === "email" ? "Sign in with Gmail" : "Enter Verification Code"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {step === "email"
              ? "Enter your email address to receive a 6-digit verification code."
              : `We sent a 6-digit code to ${email}`}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-3 text-sm font-semibold transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-300 dark:border-chat-border-dark bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-3 font-mono text-center text-lg tracking-widest text-slate-900 dark:text-slate-100 focus:border-chat-accent focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-3 text-sm font-semibold transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ← Change Email Address
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
