import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../types";
import { User, Copy, Check, Volume2, VolumeX, Sparkles, Zap, FileText, Play, Download } from "lucide-react";
import { CodePreviewModal } from "./CodePreviewModal";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  // Live Code Preview Modal State
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<string>("html");

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <>
      <div
        className={`group flex w-full gap-4 px-4 py-6 md:px-6 transition-colors ${
          isUser
            ? "bg-transparent"
            : "bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/40"
        }`}
      >
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white shadow-md">
              <User className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 animate-pulse-slow">
              <Zap className="h-5 w-5 fill-current" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Author Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {isUser ? "You" : "Afridi-GPT"}
              </span>
              {!isUser && (
                <span className="flex items-center gap-1 rounded-md bg-chat-accent/15 px-2 py-0.5 text-[11px] font-semibold text-chat-accent">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Multimodal</span>
                </span>
              )}
            </div>

            {/* Message Actions */}
            {!isUser && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Read Aloud Button */}
                <button
                  onClick={handleToggleSpeech}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title={isSpeaking ? "Stop reading" : "Read aloud"}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4 text-emerald-500 animate-pulse" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>

                {/* Copy Message Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Copy response"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Render Message Attachments (Images or PDF Badges) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="my-2 flex flex-wrap gap-2">
              {message.attachments.map((att, idx) => (
                <div key={idx}>
                  {att.type.startsWith("image/") && att.url ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      onClick={() => setSelectedFullImage(att.url!)}
                      className="h-36 max-w-xs rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
                      {att.type === "application/pdf" ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500 font-bold text-[10px]">
                          PDF
                        </div>
                      ) : (
                        <FileText className="h-4 w-4 text-emerald-500" />
                      )}
                      <span>{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Content Body */}
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const lang = match ? match[1].toLowerCase() : "code";
                  const codeContent = String(children).replace(/\n$/, "");

                  const isRunnable = true;

                  return !inline ? (
                    <div className="relative my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                        <span className="font-bold text-emerald-400 uppercase tracking-wider">{lang}</span>
                        <div className="flex items-center gap-3">
                          {isRunnable && (
                            <button
                              onClick={() => {
                                setPreviewCode(codeContent);
                                setPreviewLang(lang);
                              }}
                              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors bg-emerald-500/10 px-2 py-0.5 rounded"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Run Live Preview</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const extMap: Record<string, string> = {
                                html: "html",
                                javascript: "js",
                                js: "js",
                                typescript: "ts",
                                ts: "ts",
                                python: "py",
                                py: "py",
                                json: "json",
                                css: "css",
                              };
                              const ext = extMap[lang] || "txt";
                              const blob = new Blob([codeContent], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Afridi-Code-Snippet.${ext}`;
                              a.click();
                            }}
                            className="hover:text-white transition-colors flex items-center gap-1"
                            title="Download code snippet file"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeContent);
                            }}
                            className="hover:text-white transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-300">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block ml-1 h-4 w-2 bg-chat-accent animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Live Code Execution Modal */}
      <CodePreviewModal
        isOpen={Boolean(previewCode)}
        onClose={() => setPreviewCode(null)}
        code={previewCode || ""}
        language={previewLang}
      />

      {/* Fullscreen Image Preview Lightbox Modal */}
      {selectedFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedFullImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={selectedFullImage}
              alt="Full preview"
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
