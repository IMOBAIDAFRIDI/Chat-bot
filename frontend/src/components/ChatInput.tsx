import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Mic, MicOff, Paperclip, Image as ImageIcon, FileText, X, Globe, Sparkles } from "lucide-react";
import { Attachment } from "../types";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
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
  const [isImageMode, setIsImageMode] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (recognitionRef.current) recognitionRef.current.stop();
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

  // Handle Multi-file Upload (Images, PDFs, Documents, Code)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      const reader = new FileReader();

      if (isImage || isPdf) {
        // Read as Data URL / Base64
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          // Extract base64 part
          const base64Data = dataUrl.split(",")[1] || dataUrl;
          const mimeType = isImage ? file.type : "application/pdf";

          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: mimeType,
              data: base64Data,
              url: isImage ? dataUrl : undefined,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Read text / code file
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: "text/plain",
              data: text,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming || disabled) return;

    let fullPrompt = input.trim();

    // If Image Mode is toggled and prompt doesn't start with /image
    if (isImageMode && !fullPrompt.toLowerCase().startsWith("/image")) {
      fullPrompt = `/image ${fullPrompt}`;
    }

    onSend(fullPrompt, attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
    setIsImageMode(false);
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
        {/* Attached Files & Image Thumbnail Preview Bar */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative group flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1.5 pr-3 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
              >
                {att.type.startsWith("image/") && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="h-10 w-10 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
                  />
                ) : att.type === "application/pdf" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 font-bold text-[10px]">
                    PDF
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FileText className="h-5 w-5" />
                  </div>
                )}

                <div className="flex flex-col truncate max-w-[140px]">
                  <span className="font-semibold truncate">{att.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {att.type.startsWith("image/")
                      ? "Image attached"
                      : att.type === "application/pdf"
                      ? "PDF document"
                      : "Text document"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-3xl border border-slate-300/80 dark:border-chat-border-dark bg-white dark:bg-chat-card-dark shadow-xl transition-all focus-within:border-chat-accent focus-within:ring-4 focus-within:ring-chat-accent/15"
        >
          {/* Hidden Multi-file Input (Images, PDFs, Text, Code) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.txt,.js,.ts,.jsx,.tsx,.py,.json,.csv,.md,.html,.css"
            className="hidden"
          />

          {/* Mode Switchers Left Bar */}
          <div className="flex items-center gap-1 pl-3">
            {/* Attach File/Image/PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Attach Images, PDFs, or Code documents"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* AI Image Generation Toggle */}
            <button
              type="button"
              onClick={() => setIsImageMode(!isImageMode)}
              className={`p-2 rounded-2xl transition-all ${
                isImageMode
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isImageMode ? "AI Art Generator Active" : "Toggle AI Art Generator"}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isImageMode
                ? "Describe the AI image you want to generate..."
                : attachments.length > 0
                ? "Ask a question about your attached Image/PDF..."
                : "Message Afridi-GPT (Upload Images, PDFs or type /image)..."
            }
            disabled={disabled}
            className="w-full resize-none bg-transparent py-4 pl-3 pr-24 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50 max-h-48"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {/* Voice Typing Button */}
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

            {/* Send / Stop Button */}
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
                disabled={(!input.trim() && attachments.length === 0) || disabled}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <p className="mt-2 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Afridi-GPT v3.5 Pro • Multimodal Vision (Images & PDFs) & Real-Time AI Engine
        </p>
      </div>
    </div>
  );
};
