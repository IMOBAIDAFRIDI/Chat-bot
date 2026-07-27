import React from "react";
import { X, Play, ExternalLink } from "lucide-react";

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

  const cleanLang = (language || "").toLowerCase().trim();

  const getSrcDoc = () => {
    // 1. Python Live Execution Engine via Pyodide WebAssembly
    if (cleanLang === "python" || cleanLang === "py") {
      const escapedCode = code
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Python Sandbox</title>
            <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
            <style>
              body { background-color: #090d16; color: #10b981; font-family: 'JetBrains Mono', monospace; padding: 24px; font-size: 14px; margin: 0; line-height: 1.6; }
              #console { white-space: pre-wrap; word-break: break-word; }
              .error { color: #f43f5e; font-weight: bold; }
              .info { color: #38bdf8; }
              .success { color: #34d399; }
            </style>
          </head>
          <body>
            <div id="console"><span class="info">⚡ Initializing Python WebAssembly Engine...</span>\n</div>
            <script>
              async function runPython() {
                const con = document.getElementById("console");
                try {
                  let pyodide = await loadPyodide();
                  con.innerHTML = "<span class='info'>🐍 Running Python script...</span>\n\n";
                  
                  pyodide.setStdout({
                    batched: (str) => { con.innerHTML += str + "\n"; }
                  });
                  
                  await pyodide.runPythonAsync(\`${escapedCode}\`);
                  con.innerHTML += "\n<span class='success'>✔ [Process completed successfully]</span>";
                } catch(e) {
                  con.innerHTML += "\n<span class='error'>Traceback Error:\n" + e.message + "</span>";
                }
              }
              runPython();
            </script>
          </body>
        </html>
      `;
    }

    // 2. HTML / CSS / JS / React / UI Code Live Preview
    if (!code.includes("<html") && !code.includes("<!DOCTYPE")) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
              body { padding: 1.5rem; background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
              ${cleanLang === "css" ? code : ""}
            </style>
          </head>
          <body>
            <div id="root">
              ${cleanLang !== "css" ? code : "<div class='p-4 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold'>CSS Styles Applied Successfully</div>"}
            </div>
            <script>
              // Catch console logs and display on screen if no UI element
              console.log = function(...args) {
                const root = document.getElementById("root");
                if (root && root.children.length === 0) {
                  root.innerHTML += "<div style='color:#38bdf8; font-family:monospace; margin-top:10px;'>Console > " + args.join(" ") + "</div>";
                }
              };
            </script>
          </body>
        </html>
      `;
    }

    return code;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold shadow-md">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Afridi-GPT Universal Live Code Sandbox</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 uppercase font-bold">
                  {cleanLang || "LIVE"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Executes HTML, CSS, JavaScript, React & Python scripts in real-time</p>
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
            className="h-full w-full border-none bg-slate-950"
          />
        </div>
      </div>
    </div>
  );
};
