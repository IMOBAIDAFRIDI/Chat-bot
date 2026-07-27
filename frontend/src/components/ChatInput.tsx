import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Mic, MicOff, Sparkles, Globe } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Voice Typing Speech Recognition setup
  const toggleVoiceTyping = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice typing is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-white via-white/95 to-transparent dark:from-chat-bg-dark dark:via-chat-bg-dark/95 p-4 sm:p-6 backdrop-blur-md">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-3xl border border-slate-300/80 dark:border-chat-border-dark bg-white dark:bg-chat-card-dark shadow-xl transition-all focus-within:border-chat-accent focus-within:ring-4 focus-within:ring-chat-accent/15"
        >
          {/* Web Search Active Badge */}
          <div className="hidden sm:flex items-center gap-1.5 pl-4 text-xs font-semibold text-chat-accent">
            <Globe className="h-4 w-4" />
            <span className="hidden lg:inline">Web Search</span>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Afridi-GPT..."
            disabled={disabled}
            className="w-full resize-none bg-transparent py-4 pl-4 pr-24 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50 max-h-48"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {/* Voice Typing Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceTyping}
              className={`p-2.5 rounded-2xl transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isListening ? "Stop voice typing" : "Start voice typing"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Send / Stop Streaming Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
                title="Stop generation"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <p className="mt-2 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Afridi-GPT v3.5 Pro • Ultra-Fast Real-Time AI Search Engine
        </p>
      </div>
    </div>
  );
};
