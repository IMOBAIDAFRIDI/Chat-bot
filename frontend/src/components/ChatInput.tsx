import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end w-full rounded-2xl border border-slate-300 dark:border-chat-border-dark bg-white dark:bg-chat-card-dark shadow-lg focus-within:border-chat-accent dark:focus-within:border-chat-accent transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message GPT-5.4 Mini..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm md:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-48 scrollbar-thin"
        />

        <div className="absolute right-3 bottom-2.5 flex items-center">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
              title="Stop generating"
            >
              <Square className="h-4 w-4 fill-white" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all shadow-sm ${
                input.trim() && !disabled
                  ? "bg-chat-accent text-white hover:bg-chat-accentHover cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
              title="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        GPT-5.4 Mini may produce inaccurate information about people, places, or facts.
      </p>
    </div>
  );
};
