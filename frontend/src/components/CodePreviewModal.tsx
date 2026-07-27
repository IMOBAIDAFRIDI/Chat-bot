import React from "react";
import { X, Play, RefreshCw, ExternalLink, Code2, Maximize2 } from "lucide-react";

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  if (!isOpen) return null;

  // Construct iframe html srcDoc
  const getSrcDoc = () => {
    if (language === "html" || code.includes("<html") || code.includes("<!DOCTYPE") || code.includes("<div")) {
      return code;
    }

    // Wrap JS or CSS inside a full HTML template
    if (language === "javascript" || language === "js" || language === "ts") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>body { font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; }</style>
          </head>
          <body>
            <div id="output"></div>
            <script>
              console.log = function(...args) {
                const out = document.getElementById("output");
                out.innerHTML += "<div>> " + args.join(" ") + "</div>";
              };
              try {
                ${code}
              } catch (e) {
                document.getElementById("output").innerHTML += "<div style='color:#f43f5e;'>Error: " + e.message + "</div>";
              }
            </script>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-6 bg-slate-900 text-slate-100">
          <pre>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Afridi-GPT Interactive Live Preview</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 uppercase">
                  {language || "HTML/JS"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Real-time live execution iframe sandbox</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const win = window.open();
                if (win) {
                  win.document.write(getSrcDoc());
                  win.document.close();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Window</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Iframe Frame */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          <iframe
            title="Live Code Preview Sandbox"
            srcDoc={getSrcDoc()}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="h-full w-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};
