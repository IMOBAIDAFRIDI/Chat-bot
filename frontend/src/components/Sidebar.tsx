import React, { useState } from "react";
import { Plus, MessageSquare, Edit2, Trash2, Check, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { Chat } from "../types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  isOpen,
  onToggle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      onDeleteChat(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-chat-sidebar-light dark:bg-chat-sidebar-dark border-r border-slate-200 dark:border-chat-border-dark transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-72"
        }`}
      >
        {/* Top Actions */}
        <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-chat-border-dark/60">
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-chat-accent hover:bg-chat-accentHover text-white px-4 py-2.5 font-medium text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chat History
          </div>

          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              No previous conversations yet.
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => !isEditing && onSelectChat(chat.id)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all ${
                    isActive
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-chat-accent" />

                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveEdit(chat.id, e)}
                      className="flex items-center gap-1 flex-1 min-w-0"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-chat-accent rounded px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(chat.id, e)}
                        className="p-1 text-emerald-500 hover:text-emerald-400"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 text-rose-500 hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="truncate flex-1">{chat.title}</span>

                      {/* Action buttons (Rename / Delete) */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => handleStartEdit(chat, e)}
                          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Rename chat"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(chat.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
