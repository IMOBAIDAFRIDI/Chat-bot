import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Sparkles, Zap, Search } from "lucide-react";
import { Chat } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (chatId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 dark:border-chat-border-dark bg-white dark:bg-chat-sidebar-dark transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-chat-border-dark/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-extrabold text-base bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Afridi-GPT
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 space-y-2">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-white py-3 px-4 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Conversation</span>
          </button>

          {/* Search Filter Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-chat-accent/60"
            />
          </div>
        </div>

        {/* Chat Sessions History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recent Conversations ({filteredChats.length})
          </div>

          {filteredChats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              No conversations found.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = chat.id === editingChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800/90 text-chat-accent shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <MessageSquare className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-chat-accent" : "text-slate-400"}`} />
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(chat.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-32 bg-white dark:bg-slate-900 border border-chat-accent rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                          autoFocus
                        />
                        <button type="submit" className="p-0.5 text-emerald-500">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate text-xs font-semibold">{chat.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(chat, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Rename topic"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-chat-border-dark/60 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Afridi-GPT Pro</span>
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <Sparkles className="h-3 w-3" />
              <span>v3.5</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
