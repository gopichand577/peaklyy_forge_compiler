import {
  Check,
  Copy,
  ExternalLink,
  Keyboard,
  Loader2,
  Monitor,
  RefreshCw,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "../../context/EditorContext";

const closeTag = (tag) => new RegExp(`</${tag}\\s*>`, "i");

function insertBeforeClose(source, tag, content) {
  const closingTag = closeTag(tag);
  return closingTag.test(source)
    ? source.replace(closingTag, `${content}</${tag}>`)
    : `${source}${content}`;
}

function buildPreviewDocument(html = "", css = "", javascript = "") {
  const page = /<html[\s>]/i.test(html)
    ? html
    : `<!doctype html><html><head></head><body>${html}</body></html>`;
  const withHead = /<head[\s>]/i.test(page)
    ? page
    : page.replace(/<html([^>]*)>/i, "<html$1><head></head>");
  const baseStyles = `<style>
    * { box-sizing: border-box; }
    html, body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>`;
  const withBase = insertBeforeClose(withHead, "head", baseStyles);
  const withStyles = insertBeforeClose(withBase, "head", `<style>${css}</style>`);
  const safeScript = `<script>
    window.onerror = function(msg, url, line) {
      console.warn("Preview runtime error:", msg, "line:", line);
      return false;
    };
    try {
      ${javascript}
    } catch (e) {
      console.warn("Preview execution caught:", e.message);
    }
  </script>`;
  return insertBeforeClose(withStyles, "body", safeScript);
}


export default function Preview({ isFullscreenMode = false }) {
  const {
    project,
    activeFile,
    stdin,
    setStdin,
    clearStdin,
    runCode,
    isRunning,
    isWaitingForInput,
    activePrompt,
    sendTerminalInput,
    terminalHistory,
    clearTerminal,
    stopExecution,
    openConfirmModal,
  } = useEditor();

  const files = project?.files || [];
  const activeFileExt = (activeFile?.name || "").split(".").pop().toLowerCase();
  const hasWebFiles = files.some(
    (f) =>
      f.name.toLowerCase().endsWith(".html") ||
      f.name.toLowerCase().endsWith(".css") ||
      f.name.toLowerCase().endsWith(".htm")
  );
  const isWebLanguage = (project?.language && ["html", "css"].includes(project?.language)) || hasWebFiles;

  const [activeTab, setActiveTab] = useState(
    project?.language && ["html", "css"].includes(project?.language) && activeFileExt !== "py" && activeFileExt !== "java"
      ? "preview"
      : "stdin"
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [interactiveVal, setInteractiveVal] = useState("");

  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const inlineInputRef = useRef(null);
  const historyListRef = useRef(null);

  // When active file changes, auto-switch to appropriate tab
  useEffect(() => {
    if (activeFileExt === "py" || activeFileExt === "java") {
      setActiveTab("stdin");
    } else if (activeFileExt === "html" || activeFileExt === "css" || activeFileExt === "htm") {
      setActiveTab("preview");
    }
  }, [activeFile?.id, activeFile?.name, activeFileExt]);

  // Focus inline input when waiting for input
  useEffect(() => {
    if (isWaitingForInput) {
      const timer = setTimeout(() => {
        inlineInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isWaitingForInput]);

  // Auto scroll terminal history list
  useEffect(() => {
    if (historyListRef.current) {
      historyListRef.current.scrollTop = historyListRef.current.scrollHeight;
    }
  }, [terminalHistory, isWaitingForInput, isRunning]);

  const documentContent = useMemo(() => {
    const htmlFile = files.find(
      (f) => f.name.toLowerCase().endsWith(".html") || f.name.toLowerCase().endsWith(".htm")
    );
    const cssFile = files.find((f) => f.name.toLowerCase().endsWith(".css"));
    const jsFile = files.find(
      (f) =>
        (f.name.toLowerCase().endsWith(".js") || f.name.toLowerCase().endsWith(".jsx")) &&
        !f.name.toLowerCase().endsWith(".py") &&
        !f.name.toLowerCase().endsWith(".java")
    );

    const htmlContent = htmlFile
      ? htmlFile.content
      : project?.language === "html" && (!activeFile || !activeFile.name.endsWith(".py"))
      ? project?.html || ""
      : "<!doctype html><html><body></body></html>";

    const cssContent = cssFile
      ? cssFile.content
      : project?.language === "css"
      ? project?.css || ""
      : "";

    const jsContent = jsFile ? jsFile.content : "";

    return buildPreviewDocument(htmlContent, cssContent, jsContent);
  }, [files, project?.html, project?.css, project?.language, activeFile]);

  const openPreview = () => {
    const tab = window.open("", "_blank");
    if (!tab) return;
    tab.document.open();
    tab.document.write(documentContent);
    tab.document.close();
  };

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = stdin || "";
      const next = val.substring(0, start) + "  " + val.substring(end);
      setStdin(next);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = (stdin || "").split("\n");
  const lineCount = Math.max(lines.length, 1);

  const [copiedStdin, setCopiedStdin] = useState(false);

  const handleCopyStdin = async () => {
    try {
      await navigator.clipboard.writeText(stdin || "");
      setCopiedStdin(true);
      setTimeout(() => setCopiedStdin(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleClearInputClick = () => {
    openConfirmModal({
      title: "Clear Standard Input?",
      message:
        terminalHistory.length > 0
          ? "This will clear the interactive terminal prompt history. Your editor code and output will not be changed."
          : "This will clear all standard input (stdin) text. Your editor code and output will not be changed.",
      confirmText: "Clear Input",
      onConfirm: () => {
        if (terminalHistory.length > 0) {
          clearTerminal();
        } else {
          clearStdin();
        }
      },
    });
  };

  return (
    <section className={`panel preview-card ${isFullscreenMode ? "fullscreen-preview-card" : ""}`}>
      <div className="panel-header preview-header">
        <div className="preview-header-left">
          {isWebLanguage ? (
            <div className="preview-tab-group">
              <button
                type="button"
                className={`output-tab-btn ${activeTab === "preview" ? "active" : ""}`}
                onClick={() => setActiveTab("preview")}
              >
                <Monitor size={14} className="preview-header-icon" />
                <span>Live Preview</span>
                <span className="live-status-pill">LIVE</span>
              </button>

              <button
                type="button"
                className={`output-tab-btn ${activeTab === "stdin" ? "active" : ""}`}
                onClick={() => setActiveTab("stdin")}
              >
                <Keyboard size={14} />
                <span>Input (stdin)</span>
              </button>
            </div>
          ) : (
            <div className="preview-tab-group">
              <div className="output-tab-btn active preview-static-tab">
                <Keyboard size={14} />
                <span>Input console (stdin)</span>
              </div>

              {isWaitingForInput ? (
                <span className="stdin-waiting-badge">
                  <span className="stdin-pulse-dot" />
                  <span>Waiting...</span>
                </span>
              ) : isRunning ? (
                <span className="stdin-lines-badge running">
                  <Loader2 size={11} className="animate-spin" />
                  <span>Running...</span>
                </span>
              ) : (
                <span className="stdin-lines-badge">
                  {terminalHistory.length > 0 ? "Terminal" : `${lineCount} ${lineCount === 1 ? "line" : "lines"}`}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="preview-header-right">
          {isWebLanguage && activeTab === "preview" && (
            <div className="preview-actions-group">
              <button
                type="button"
                className="icon-only-btn"
                aria-label="Refresh preview"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Refresh preview"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                className="icon-only-btn"
                aria-label="Open preview in new tab"
                onClick={openPreview}
                title="Open in new tab"
              >
                <ExternalLink size={15} />
              </button>
            </div>
          )}

          {(!isWebLanguage || activeTab === "stdin") && (
            <div className="preview-actions-group">
              {isRunning ? (
                <button
                  type="button"
                  className="stdin-stop-btn"
                  onClick={stopExecution}
                  title="Stop running program"
                >
                  <Square size={11} fill="currentColor" />
                  <span>Stop</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="stdin-action-btn"
                    onClick={handleCopyStdin}
                    title={copiedStdin ? "Copied to clipboard!" : "Copy input text"}
                  >
                    {copiedStdin ? <Check size={12} style={{ color: "#22c55e" }} /> : <Copy size={12} />}
                    <span>{copiedStdin ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    className="stdin-action-btn stdin-clear-action-btn"
                    onClick={handleClearInputClick}
                    title={terminalHistory.length > 0 ? "Clear terminal history" : "Clear all input lines"}
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="preview-body-wrap">
        {isWebLanguage && activeTab === "preview" ? (
          <div className="preview-mac-window preview-browser-window">
            <div className="browser-bar preview-window-bar">
              <div className="mac-dots-container">
                <span className="mac-dot red" />
                <span className="mac-dot yellow" />
                <span className="mac-dot green" />
              </div>
              <div className="mac-address-bar">peaklyy-forge.preview</div>
            </div>
            <iframe
              className="preview-iframe"
              key={`${refreshKey}-${documentContent}`}
              title="Live project preview"
              srcDoc={documentContent}
              sandbox="allow-scripts"
            />
          </div>
        ) : isWaitingForInput || terminalHistory.length > 0 ? (
          <div
            className="interactive-stdin-container"
            onClick={() => inlineInputRef.current?.focus()}
          >
            {(isRunning || isWaitingForInput) && (
              <div className="interactive-status-banner">
                <div className="interactive-status-left">
                  {isWaitingForInput ? (
                    <span className="stdin-pulse-dot" />
                  ) : (
                    <Loader2 size={13} className="animate-spin" style={{ color: "#ef4444" }} />
                  )}
                  <span className="interactive-status-text">
                    {isWaitingForInput ? "Program is waiting for input" : "Program is executing..."}
                  </span>
                </div>
              </div>
            )}

            <div className="interactive-history-list" ref={historyListRef}>
              {terminalHistory.map((line, idx) => (
                <div
                  key={idx}
                  className={`interactive-history-line ${
                    line.startsWith(">") ? "history-input" : "history-prompt"
                  }`}
                >
                  {line.startsWith(">") ? (
                    <span style={{ color: "#38bdf8", fontWeight: "600" }}>{line}</span>
                  ) : (
                    <span style={{ color: "#ff5460", fontWeight: "600" }}>{line}</span>
                  )}
                </div>
              ))}

              {isRunning && (
                <form
                  className="interactive-inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isWaitingForInput) return;
                    const val = interactiveVal;
                    setInteractiveVal("");
                    sendTerminalInput(val);
                  }}
                >
                  <div className="interactive-inline-row">
                    <span className="interactive-prompt-symbol">
                      &gt;
                    </span>
                    <input
                      ref={inlineInputRef}
                      type="text"
                      className="interactive-inline-field"
                      value={interactiveVal}
                      onChange={(e) => setInteractiveVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isWaitingForInput) return;
                          const val = interactiveVal;
                          setInteractiveVal("");
                          sendTerminalInput(val);
                        }
                      }}
                      placeholder={
                        isWaitingForInput ? "" : "Program is executing..."
                      }
                      disabled={!isWaitingForInput}
                      autoFocus
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="stdin-console-wrapper">
            <div className="stdin-gutter" ref={gutterRef}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="stdin-line-number">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="stdin-textarea"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder="Enter input values for your program here (one per line)..."
            />
          </div>
        )}
      </div>
    </section>
  );
}


