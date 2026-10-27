import React, { useEffect, useState } from "react";
import {
  Code2,
  FolderOpen,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { TARGET_LANGUAGES } from "../../constants/languages";
import LanguageIcon from "./LanguageIcon";

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    runCode,
    setActiveNav,
    setProjectDialogOpen,
    clearTerminal,
    toggleFullscreen,
    isFullscreen,
    setSettingsOpen,
    setLanguage,
    resetCurrentFile,
    theme,
    setTheme,
  } = useEditor();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+Shift+P or Cmd+Shift+P or Ctrl+K or Cmd+K
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))
      ) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const commands = [
    {
      id: "run-code",
      title: "Run Program",
      subtitle: "Execute active source code in secure sandbox",
      icon: <Play size={16} fill="currentColor" className="text-red" />,
      shortcut: "Ctrl + Enter",
      action: () => {
        runCode();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "open-projects",
      title: "Open Projects Workspace",
      subtitle: "Manage recent projects, create new workspace, or import/export JSON",
      icon: <FolderOpen size={16} />,
      shortcut: "Ctrl + O",
      action: () => {
        setProjectDialogOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-fullscreen",
      title: isFullscreen ? "Exit Fullscreen Editor" : "Toggle Fullscreen Editor",
      subtitle: "Expand code editor into focused workstation view",
      icon: isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />,
      shortcut: "F11",
      action: () => {
        toggleFullscreen();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "open-settings",
      title: "IDE Editor Settings",
      subtitle: "Configure font size, tab spaces, word wrap, minimap, and line numbers",
      icon: <Settings size={16} />,
      shortcut: "Ctrl + ,",
      action: () => {
        setSettingsOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-theme",
      title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`,
      subtitle: `Toggle between dark crimson and clean light UI mode`,
      icon: <Sparkles size={16} className="text-red" />,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-compiler",
      title: "Switch to Compiler Mode",
      subtitle: "P0 Interactive multi-language IDE workspace",
      icon: <Code2 size={16} />,
      action: () => {
        setActiveNav("compiler");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "reset-code",
      title: "Reset Starter Template",
      subtitle: "Restore active file to clean starter template",
      icon: <RotateCcw size={16} />,
      action: () => {
        if (window.confirm("Reset active file to clean starter code?")) {
          resetCurrentFile();
        }
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "clear-terminal",
      title: "Clear Terminal Console",
      subtitle: "Clear interactive stdin prompt history and outputs",
      icon: <Trash2 size={16} />,
      action: () => {
        clearTerminal();
        setCommandPaletteOpen(false);
      },
    },
    // Language Switchers
    ...TARGET_LANGUAGES.map((lang) => ({
      id: `lang-${lang}`,
      title: `Switch Language: ${lang.toUpperCase()}`,
      subtitle: `Set active execution language to ${lang}`,
      icon: <LanguageIcon language={lang} size={16} />,
      action: () => {
        setLanguage(lang);
        setCommandPaletteOpen(false);
      },
    })),
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="command-palette-backdrop"
      onMouseDown={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="command-palette-card" onMouseDown={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="command-palette-search-row">
          <Search size={18} className="command-search-icon text-red" />
          <input
            type="text"
            className="command-search-input"
            placeholder="Type a command or search actions (e.g. Run, Practice, Settings, Python)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="command-esc-badge">ESC</span>
        </div>

        {/* Command List */}
        <div className="command-list-container">
          {filteredCommands.length === 0 ? (
            <div className="command-empty-state">
              <Sparkles size={24} className="empty-icon" />
              <p>No commands matching "{query}"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`command-item-row ${isSelected ? "selected" : ""}`}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="command-item-left">
                    <div className="command-icon-box">{cmd.icon}</div>
                    <div className="command-text-wrap">
                      <span className="command-title">{cmd.title}</span>
                      <span className="command-subtitle">{cmd.subtitle}</span>
                    </div>
                  </div>
                  {cmd.shortcut && <span className="command-shortcut-badge">{cmd.shortcut}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
