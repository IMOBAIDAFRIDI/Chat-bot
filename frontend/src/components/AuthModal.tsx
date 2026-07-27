import React, { useState } from "react";
import { X, Mail, Lock, User, ShieldCheck, ArrowRight, RefreshCw, KeyRound, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendOtpApi, verifyOtpApi, loginApi } from "../services/api";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, setAuthData } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up state
  const [signupStep, setSignupStep] = useState<"details" | "verify">("details");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessNotice, setSignupSuccessNotice] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await loginApi(loginEmail.trim(), loginPassword);
      setAuthData(res.user, res.token);
    } catch (err: any) {
      setLoginError(err.message || "Failed to sign in");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccessNotice(null);
    setDevOtpHint(null);
    setSignupLoading(true);

    try {
      const res = await sendOtpApi(signupEmail.trim());
      setSignupSuccessNotice(res.message);
      if (res.devOtpCode) {
        setDevOtpHint(res.devOtpCode);
      }
      setSignupStep("verify");
    } catch (err: any) {
      setSignupError(err.message || "Failed to send verification code");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);

    try {
      const res = await verifyOtpApi(
        signupEmail.trim(),
        otpCode.trim(),
        signupName.trim(),
        signupPassword
      );
      setAuthData(res.user, res.token);
    } catch (err: any) {
      setSignupError(err.message || "Invalid or expired verification code");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-chat-card-dark border border-slate-200 dark:border-chat-border-dark rounded-3xl shadow-2xl overflow-hidden transition-all">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-chat-border-dark/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chat-accent text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Account Access
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-chat-border-dark/60 bg-slate-50/50 dark:bg-slate-900/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "signup"
                ? "bg-white dark:bg-slate-800 text-chat-accent shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign Up (Email OTP)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "signin"
                ? "bg-white dark:bg-slate-800 text-chat-accent shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {activeTab === "signin" ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-3 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loginLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM (OTP Verification) */
            <div className="space-y-4">
              {signupError && (
                <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                  {signupError}
                </div>
              )}

              {signupSuccessNotice && (
                <div className="p-3 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                  {signupSuccessNotice}
                </div>
              )}

              {signupStep === "details" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Email Address (SMTP Verification)
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Create Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-3 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {signupLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Get Email Verification Code</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Enter 6-Digit Email Verification Code
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-chat-border-dark rounded-xl pl-10 pr-4 py-2.5 text-center tracking-widest font-mono text-lg font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-chat-accent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupStep("details")}
                      className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={signupLoading || otpCode.length !== 6}
                      className="flex-2 flex items-center justify-center gap-2 rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white py-2.5 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {signupLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Verify & Sign Up</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
