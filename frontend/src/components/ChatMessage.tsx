import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot, User as UserIcon } from "lucide-react";
import { Message } from "../types";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`group py-6 px-4 md:px-8 border-b border-slate-200/50 dark:border-chat-border-dark/40 transition-colors ${
        isUser
          ? "bg-transparent"
          : "bg-slate-100/50 dark:bg-slate-900/40"
      }`}
    >
      <div className="mx-auto flex max-w-4xl gap-4 md:gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm dark:bg-slate-700">
              <UserIcon className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chat-accent text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {isUser ? "You" : "Claude 3.5 Sonnet"}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (!inline && (match || codeString.includes("\n"))) {
                    return (
                      <CodeBlock
                        language={match ? match[1] : ""}
                        code={codeString}
                      />
                    );
                  }
                  return (
                    <code
                      className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400"
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
              <span className="inline-block h-4 w-2 ml-1 bg-chat-accent animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
