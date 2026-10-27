import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  FileText,
  Loader2,
  Terminal,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useEditor } from "../../context/EditorContext";

export default function Output({ isFullscreenMode = false }) {
  const { output, clearOutput, isRunning, jumpToErrorLine, openConfirmModal } = useEditor();
  const [activeTab, setActiveTab] = useState("console"); // 'console' | 'error' | 'info'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (output.status === "COMPILATION_ERROR" || output.status === "RUNTIME_ERROR" || (output.error && !output.output)) {
      setActiveTab("error");
    } else if (output.status === "SUCCESS") {
      setActiveTab("console");
    }
  }, [output.status, output.error, output.output]);

  const handleCopy = () => {
    const textToCopy = activeTab === "error" ? (output.error || "") : (output.output || output.value || "");

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const handleClearClick = () => {
    openConfirmModal({
      title: "Clear Output Console?",
      message: "This will clear all program output, error traces, and execution status. Your editor code and input will not be changed.",
      confirmText: "Clear Console",
      onConfirm: () => {
        clearOutput();
      },
    });
  };

  const renderFormattedLine = (line, idx) => {
    // Regex for line numbers: e.g. 'line 12' or ':12:' or ':12'
    const lineMatch = line.match(/(?:line\s+|:)(\d+)/i);
    const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : null;

    return (
      <div key={idx} className="output-console-line" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>{line}</span>
        {lineNum && lineNum > 0 && (
          <button
            type="button"
            className="error-line-jump-btn"
            onClick={() => jumpToErrorLine(lineNum)}
            title={`Jump to line ${lineNum} in editor`}
            style={{
              padding: "1px 6px",
              fontSize: "11px",
              borderRadius: "4px",
              background: "rgba(255, 30, 60, 0.2)",
              border: "1px solid rgba(255, 30, 60, 0.4)",
              color: "#ff6b7b",
              cursor: "pointer",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            Line {lineNum} ↵
          </button>
        )}
      </div>
    );
  };

  const renderFormattedOutput = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => renderFormattedLine(line, idx));
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "COMPILING":
        return { label: "COMPILING", className: "running", icon: <Loader2 size={13} className="animate-spin" /> };
      case "RUNNING":
        return { label: "RUNNING", className: "running", icon: <Loader2 size={13} className="animate-spin" /> };
      case "SUCCESS":
        return { label: "SUCCESS", className: "success", icon: <CheckCircle2 size={13} /> };
      case "COMPILATION_ERROR":
        return { label: "COMPILATION ERROR", className: "error", icon: <AlertTriangle size={13} /> };
      case "RUNTIME_ERROR":
        return { label: "RUNTIME ERROR", className: "error", icon: <AlertTriangle size={13} /> };
      case "TIME_LIMIT_EXCEEDED":
        return { label: "TIME LIMIT EXCEEDED", className: "warning", icon: <Clock size={13} /> };
      case "MEMORY_LIMIT_EXCEEDED":
        return { label: "MEMORY LIMIT EXCEEDED", className: "warning", icon: <Cpu size={13} /> };
      case "OUTPUT_LIMIT_EXCEEDED":
        return { label: "OUTPUT LIMIT EXCEEDED", className: "warning", icon: <AlertTriangle size={13} /> };
      case "SYSTEM_ERROR":
        return { label: "SYSTEM ERROR", className: "error", icon: <AlertTriangle size={13} /> };
      case "PROCESS_ERROR":
        return { label: "PROCESS ERROR", className: "error", icon: <AlertTriangle size={13} /> };
      default:
        return null;
    }
  };

  const statusInfo = getStatusDisplay(output.status);

  return (
    <section className={`panel output-card ${isFullscreenMode ? "fullscreen-output-card" : ""}`}>
      <div className="panel-header output-tabs-header">
        {/* Output Console Tabs */}
        <div className="output-tabs-list">
          <button
            type="button"
            className={`output-tab-btn ${activeTab === "console" ? "active" : ""}`}
            onClick={() => setActiveTab("console")}
          >
            <Terminal size={14} />
            <span>Output console</span>
          </button>

          <button
            type="button"
            className={`output-tab-btn ${activeTab === "error" ? "active" : ""}`}
            onClick={() => setActiveTab("error")}
          >
            <AlertTriangle size={14} />
            <span>Error</span>
            {output.error && <span className="tab-error-dot" title="Error reported" />}
          </button>

          <button
            type="button"
            className={`output-tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <FileText size={14} />
            <span>Execution Info</span>
          </button>
        </div>

        {/* Right Action Controls: Copy, Clear, and Status Pills */}
        <div className="output-stats-actions">
          <button
            type="button"
            className="output-clear-btn"
            onClick={handleCopy}
            title="Copy current output to clipboard"
          >
            {copied ? <Check size={13} style={{ color: "#22c55e" }} /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            className="output-clear-btn output-action-clear"
            onClick={handleClearClick}
            title="Clear output console"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          {statusInfo && (
            <span className={`output-status-pill ${statusInfo.className}`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </span>
          )}

          {output.executionTime !== null && output.executionTime !== undefined && (
            <span className="output-stat-pill">
              <Clock size={12} />
              <span>{output.executionTime}s</span>
            </span>
          )}

          {output.memoryUsage && (
            <span className="output-stat-pill">
              <Cpu size={12} />
              <span>{output.memoryUsage}</span>
            </span>
          )}

          {output.exitCode !== null && output.exitCode !== undefined && (
            <span className="output-stat-pill exit-pill">
              <span>exit: {output.exitCode}</span>
            </span>
          )}
        </div>
      </div>

      <div className="output-console-body">
        {activeTab === "console" && (
          <div className="output-lines-container">
            {output.output !== null && output.output !== undefined && output.output !== "" ? (
              renderFormattedOutput(output.output)
            ) : output.status === "SUCCESS" ? (
              <span className="output-placeholder" style={{ color: "#94a3b8" }}>Program executed successfully with no output.</span>
            ) : output.value && output.status !== "RUNNING" && output.status !== "COMPILING" && output.value !== "Your program output will appear here." ? (
              renderFormattedOutput(output.value)
            ) : isRunning ? (
              <div className="output-loading-line">
                <Loader2 size={14} className="animate-spin" />
                <span>{output.value || "Executing program..."}</span>
              </div>
            ) : (
              <span className="output-placeholder">No output yet. Run your code to see results.</span>
            )}
          </div>
        )}

        {activeTab === "error" && (
          <div className="output-lines-container error-view">
            {output.error ? (
              renderFormattedOutput(output.error)
            ) : (
              <span className="output-placeholder">No errors reported.</span>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="output-info-view">
            <div className="info-row">
              <strong>Execution Status:</strong> <span>{output.status || "IDLE"}</span>
            </div>
            {output.compilationStatus && (
              <div className="info-row">
                <strong>Compilation:</strong> <span>{output.compilationStatus}</span>
              </div>
            )}
            <div className="info-row">
              <strong>Execution Time:</strong> <span>{output.executionTime !== null && output.executionTime !== undefined ? `${output.executionTime}s` : "N/A"}</span>
            </div>
            <div className="info-row">
              <strong>Memory Usage:</strong> <span>{output.memoryUsage || "N/A"}</span>
            </div>
            <div className="info-row">
              <strong>Exit Code:</strong> <span>{output.exitCode !== null && output.exitCode !== undefined ? output.exitCode : "N/A"}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
