/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { executeCode, fetchAvailableLanguages } from "../services/api";
import { connectInteractiveSession } from "../services/terminalSocket";
import {
  getFileLanguage,
  initialOutput,
  languageMeta,
  RUNNABLE_LANGUAGES,
  starterCode,
  TARGET_LANGUAGES,
} from "../constants/languages";

const EditorContext = createContext(null);
const STORAGE_KEY = "peaklyy-forge-projects";
const ACTIVE_KEY = "peaklyy-forge-active-project";
const NAV_KEY = "peaklyy-forge-active-nav";

export { getFileLanguage, languageMeta, RUNNABLE_LANGUAGES, TARGET_LANGUAGES };

const makeProject = (name = "Untitled project", language = "python") => {
  const meta = languageMeta[language] || languageMeta.python;
  const entryName = meta.defaultFileName || `main.${meta.extension || "py"}`;
  const code = starterCode[language] || starterCode.python || "";
  const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
  return {
    id: crypto.randomUUID(),
    name,
    language: language || "python",
    ...starterCode,
    activeFileId: entryId,
    openFileIds: [entryId],
    files: [
      { id: entryId, name: entryName, content: code, isEntry: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

function ensureProjectFiles(proj) {
  if (!proj) return proj;
  const lang = proj.language || "python";
  const meta = languageMeta[lang] || languageMeta.python;
  const entryName = meta.defaultFileName || `main.${meta.extension || "py"}`;
  const code = proj[lang] || starterCode[lang] || "";

  if (!proj.files || !Array.isArray(proj.files) || proj.files.length === 0) {
    const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
    proj.files = [
      { id: entryId, name: entryName, content: code, isEntry: true }
    ];
    proj.activeFileId = entryId;
    proj.openFileIds = [entryId];
  }
  if (!proj.activeFileId && proj.files[0]) {
    proj.activeFileId = proj.files[0].id;
  }
  if (!proj.openFileIds || !Array.isArray(proj.openFileIds) || proj.openFileIds.length === 0) {
    proj.openFileIds = proj.files.map((f) => f.id);
  }
  return proj;
}

const readProjects = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw
      .filter((p) => {
        if (!p || !p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => ensureProjectFiles(p));
  } catch (_e) {
    return [];
  }
};

export function EditorProvider({ children }) {
  // Navigation mode for P0 (only 'compiler' is active, with profile/settings)
  const [activeNav, setActiveNavState] = useState(() => {
    try {
      const saved = localStorage.getItem(NAV_KEY);
      return saved === "profile" || saved === "settings" ? saved : "compiler";
    } catch (e) {
      return "compiler";
    }
  });

  const setActiveNav = useCallback((nav) => {
    const safeNav = nav === "profile" || nav === "settings" ? nav : "compiler";
    setActiveNavState(safeNav);
    try {
      localStorage.setItem(NAV_KEY, safeNav);
    } catch (e) {
      // ignore
    }
  }, []);

  // =========================================================================
  // P0 COMPILER STATE
  // =========================================================================
  const [projects, setProjects] = useState(readProjects);
  const [project, setProject] = useState(() => {
    const saved = readProjects();
    const active = localStorage.getItem(ACTIVE_KEY);
    const found = saved.find((item) => item.id === active) || saved[0];
    return found ? ensureProjectFiles(found) : ensureProjectFiles(makeProject("My Project", "python"));
  });

  const [stdin, setStdinState] = useState(() => {
    try {
      const saved = localStorage.getItem("peaklyy-forge-stdin");
      return saved !== null ? saved : "Alice\n10\n20\n";
    } catch (e) {
      return "Alice\n10\n20\n";
    }
  });

  const setStdin = useCallback((val) => {
    setStdinState(val);
    try {
      localStorage.setItem("peaklyy-forge-stdin", val);
    } catch (e) {
      // ignore
    }
  }, []);

  const [output, setOutput] = useState(initialOutput);
  const [isRunning, setIsRunning] = useState(false);
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState("project"); // 'project' | 'file'
  const [projectDialogLang, setProjectDialogLang] = useState(null);

  // Terminal interactive state
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const activeSessionRef = useRef(null);
  const pendingPasteQueueRef = useRef([]);
  const abortControllerRef = useRef(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  // Real backend runtime availability map
  const [availableRuntimes, setAvailableRuntimes] = useState(null);

  useEffect(() => {
    fetchAvailableLanguages().then((runtimes) => {
      if (runtimes) {
        setAvailableRuntimes(runtimes);
      }
    });
  }, []);

  // Clear confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Clear",
    cancelText: "Cancel",
    onConfirm: () => {},
  });

  const openConfirmModal = useCallback(({ title, message, confirmText = "Clear", onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Editor settings & preferences
  const [editorSettings, setEditorSettingsState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("peaklyy-forge-editor-settings")) || {
          fontSize: 14,
          tabSize: 2,
          wordWrap: "on",
          minimap: false,
          lineNumbers: "on",
          autoSave: true,
        }
      );
    } catch (e) {
      return { fontSize: 14, tabSize: 2, wordWrap: "on", minimap: false, lineNumbers: "on", autoSave: true };
    }
  });

  const updateEditorSettings = useCallback((newSettings) => {
    setEditorSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("peaklyy-forge-editor-settings", JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  // Theme State
  const THEME_STORAGE_KEY = "peaklyy-forge-theme";
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch (e) {
      return "dark";
    }
  });

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Accent Color State
  const [accentColor, setAccentColorState] = useState(() => {
    try {
      return localStorage.getItem("peaklyy-forge-accent") || "#ef4444";
    } catch (e) {
      return "#ef4444";
    }
  });

  const setAccentColor = useCallback((color) => {
    setAccentColorState(color);
    try {
      localStorage.setItem("peaklyy-forge-accent", color);
      document.documentElement.style.setProperty("--red", color);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--red", accentColor);
  }, [accentColor]);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const showToast = useCallback((message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3200);
  }, []);

  // Modals & Panels
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [targetErrorLine, setTargetErrorLine] = useState(null);

  const jumpToErrorLine = useCallback((line, col = 1) => {
    setTargetErrorLine({ line, col, timestamp: Date.now() });
  }, []);

  // File explorer & tab state
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isAddingFile, setIsAddingFile] = useState(false);

  // Profile and notifications
  const [profile, setProfileState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("peaklyy-forge-profile")) || {
          displayName: "Gaurav",
          title: "Senior Software Engineer",
          bio: "Passionate about algorithms, system architecture, and writing clean, reliable code.",
        }
      );
    } catch (e) {
      return { displayName: "Gaurav", title: "Senior Software Engineer", bio: "Coding with Peaklyy Forge." };
    }
  });

  const updateProfile = useCallback((updates) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("peaklyy-forge-profile", JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

  const [compilerSettings, setCompilerSettings] = useState({
    defaultTimeoutMs: 10000,
    enableRealtimeInterception: true,
    maxOutputSizeKb: 256,
  });
  const updateCompilerSettings = useCallback((updates) => {
    setCompilerSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const [notificationSettings, setNotificationSettings] = useState({
    executionSuccess: true,
    executionError: true,
  });
  const updateNotificationSettings = useCallback((updates) => {
    setNotificationSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetPreferences = useCallback(() => {
    localStorage.removeItem("peaklyy-forge-editor-settings");
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem("peaklyy-forge-accent");
    setTheme("dark");
    setAccentColor("#ef4444");
    showToast("Preferences reset to default.", "info");
  }, [setTheme, setAccentColor, showToast]);

  // Derived active file
  const activeFile = (project?.files || []).find((f) => f.id === project?.activeFileId) || project?.files?.[0] || null;

  // Persist project changes to projects list & local storage
  const persistProject = useCallback((nextProj) => {
    if (!nextProj) return;
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === nextProj.id);
      const updated = exists ? prev.map((p) => (p.id === nextProj.id ? nextProj : p)) : [nextProj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(ACTIVE_KEY, nextProj.id);
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  // Update active file code content
  const updateCode = useCallback((newContent) => {
    setProject((prev) => {
      if (!prev) return prev;
      const ensured = ensureProjectFiles(prev);
      const currentFileId = ensured.activeFileId;
      const targetFile = (ensured.files || []).find((f) => f.id === currentFileId);
      const fileLang = targetFile ? getFileLanguage(targetFile.name, ensured.language) : ensured.language;
      const updatedFiles = (ensured.files || []).map((f) =>
        f.id === currentFileId ? { ...f, content: newContent } : f
      );
      const nextProj = {
        ...ensured,
        [fileLang]: newContent,
        files: updatedFiles,
        updatedAt: new Date().toISOString(),
      };
      persistProject(nextProj);
      return nextProj;
    });
  }, [persistProject]);

  /**
   * Safe Language Selection:
   * Synchronizes language, file extension, filename, starter template, and Monaco syntax.
   * Never silently discards user-written modifications or mutates existing files.
   */
  const setLanguage = useCallback((newLang) => {
    if (!newLang) return;
    const meta = languageMeta[newLang] || languageMeta.python;
    const targetFileName = meta.defaultFileName || `main.${meta.extension || "py"}`;
    const newStarter = starterCode[newLang] || "";

    setProject((prev) => {
      if (!prev) return makeProject("My Project", newLang);
      const ensured = ensureProjectFiles(prev);
      const updatedFiles = [...(ensured.files || [])];
      const openIds = Array.isArray(ensured.openFileIds) ? [...ensured.openFileIds] : [];

      // Check if the currently active file is already this language
      const currentActive = updatedFiles.find((f) => f.id === ensured.activeFileId) || updatedFiles[0];
      const currentActiveLang = currentActive ? getFileLanguage(currentActive.name, null) : null;
      if (currentActiveLang === newLang) {
        const nextProj = {
          ...ensured,
          language: newLang,
          activeFileId: currentActive?.id || ensured.activeFileId,
        };
        persistProject(nextProj);
        return nextProj;
      }

      // Check if another file for this language already exists in project files
      const existingLangFile = updatedFiles.find(
        (f) => getFileLanguage(f.name, null) === newLang
      );

      let nextActiveId;
      if (existingLangFile) {
        // Activate existing file without modifying it or any other file!
        nextActiveId = existingLangFile.id;
        if (!openIds.includes(nextActiveId)) {
          openIds.push(nextActiveId);
        }
      } else {
        // No file for this language exists yet: create a new file while keeping all existing files intact
        let candidateName = targetFileName;
        let counter = 1;
        while (updatedFiles.some((f) => f.name.toLowerCase() === candidateName.toLowerCase())) {
          const dotIdx = candidateName.lastIndexOf(".");
          const base = dotIdx !== -1 ? candidateName.substring(0, dotIdx) : candidateName;
          const ext = meta.extension || "txt";
          candidateName = `${base}_${counter}.${ext}`;
          counter++;
        }

        const newFileId = `file-${crypto.randomUUID().substring(0, 8)}`;
        const newFile = {
          id: newFileId,
          name: candidateName,
          content: prev[newLang] || newStarter,
          isEntry: true,
        };
        updatedFiles.push(newFile);
        nextActiveId = newFileId;
        if (!openIds.includes(nextActiveId)) {
          openIds.push(nextActiveId);
        }
      }

      const nextProj = {
        ...ensured,
        language: newLang,
        [newLang]: prev[newLang] || newStarter,
        files: updatedFiles,
        activeFileId: nextActiveId,
        openFileIds: openIds,
        updatedAt: new Date().toISOString(),
      };

      persistProject(nextProj);
      return nextProj;
    });

    showToast(`Switched language to ${meta.label}`, "info");
  }, [persistProject, showToast]);

  // Reset active file to clean starter template
  const resetCurrentFile = useCallback(() => {
    setProject((prev) => {
      if (!prev) return prev;
      const ensured = ensureProjectFiles(prev);
      const currentActive = ensured.files?.find((f) => f.id === ensured.activeFileId);
      const activeLang = getFileLanguage(currentActive?.name, ensured.language);
      const cleanStarter = starterCode[activeLang] || starterCode[ensured.language] || "";

      const updatedFiles = (ensured.files || []).map((f) =>
        f.id === ensured.activeFileId ? { ...f, content: cleanStarter } : f
      );

      const nextProj = {
        ...ensured,
        [ensured.language]: cleanStarter,
        files: updatedFiles,
        updatedAt: new Date().toISOString(),
      };
      persistProject(nextProj);
      return nextProj;
    });
    showToast("Reset to starter template.", "info");
  }, [persistProject, showToast]);

  // Clear Output Console (with confirmation protection)
  const clearOutput = useCallback(() => {
    setOutput(initialOutput);
    showToast("Output console cleared.", "info");
  }, [showToast]);

  // Clear Standard Input (with confirmation protection)
  const clearStdin = useCallback(() => {
    setStdin("");
    showToast("Standard input cleared.", "info");
  }, [setStdin, showToast]);

  // Clear Terminal Prompt & Stream History
  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
    setActivePrompt("");
    setIsWaitingForInput(false);
  }, []);

  // Stop running execution process
  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (activeSessionRef.current) {
      if (typeof activeSessionRef.current.kill === "function") {
        activeSessionRef.current.kill();
      }
      activeSessionRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
    setActivePrompt("");
    pendingPasteQueueRef.current = [];
    setOutput((prev) => ({
      ...prev,
      status: "TERMINATED",
      executionStatus: "TERMINATED",
      error: "Execution stopped by user.",
      type: "warning",
      exitCode: 130,
    }));
  }, []);

  // Interactive stdin input sender
  const sendTerminalInput = useCallback((value) => {
    if (activeSessionRef.current) {
      if (typeof activeSessionRef.current.sendStdin === "function") {
        activeSessionRef.current.sendStdin(value + "\n");
      }
      setTerminalHistory((prev) => [...prev, `> ${value}`]);
      setActivePrompt("");
      setIsWaitingForInput(false);
    }
  }, []);

  // Project and file management operations
  const createProject = useCallback((name = "Untitled Project", language = "python") => {
    const newProj = makeProject(name, language);
    setProject(newProj);
    persistProject(newProj);
    showToast(`Created project "${name}".`, "success");
    return newProj;
  }, [persistProject, showToast]);

  const openProject = useCallback((projId) => {
    const target = projects.find((p) => p.id === projId);
    if (target) {
      const ensured = ensureProjectFiles(target);
      setProject(ensured);
      try {
        localStorage.setItem(ACTIVE_KEY, target.id);
      } catch (e) {
        // ignore
      }
      showToast(`Switched to "${target.name}".`, "info");
    }
  }, [projects, showToast]);

  const renameProject = useCallback((id, newName) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name: newName } : p));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    setProject((curr) => (curr && curr.id === id ? { ...curr, name: newName } : curr));
  }, []);

  const deleteProject = useCallback((id) => {
    const targetProj = projects.find((p) => p.id === id);
    const name = targetProj?.name || "this project";
    setProjects((previous) => {
      const remaining = previous.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      } catch (e) {
        // ignore
      }
      if (project?.id === id) {
        const next = remaining[0] || makeProject("My Project", "python");
        setProject(next);
        try {
          localStorage.setItem(ACTIVE_KEY, next.id);
        } catch (e) {
          // ignore
        }
      }
      return remaining;
    });
    showToast(`Deleted project "${name}".`, "info");
  }, [project?.id, projects, showToast]);

  const importProject = useCallback((imported) => {
    if (!imported || !imported.name) return;
    const ensured = ensureProjectFiles(imported);
    setProject(ensured);
    persistProject(ensured);
    showToast(`Imported project "${ensured.name}".`, "success");
  }, [persistProject, showToast]);

  const importLocalFolder = useCallback((folderName, filesList) => {
    if (!Array.isArray(filesList) || filesList.length === 0) return;
    const entryFile = filesList[0];
    const detectedLang = getFileLanguage(entryFile.name, "javascript");

    const newProj = {
      id: crypto.randomUUID(),
      name: folderName || "Imported Project",
      language: detectedLang,
      ...starterCode,
      activeFileId: entryFile.id || `file-${crypto.randomUUID().substring(0, 8)}`,
      openFileIds: filesList.map((f, i) => f.id || `file-${i}`),
      files: filesList.map((f, i) => ({
        id: f.id || `file-${i}`,
        name: f.name,
        content: f.content || "",
        isEntry: i === 0,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProject(newProj);
    persistProject(newProj);
    showToast(`Imported folder "${folderName}" (${filesList.length} files).`, "success");
  }, [persistProject, showToast]);

  const importLocalFiles = useCallback((filesList) => {
    if (!Array.isArray(filesList) || filesList.length === 0) return;
    setProject((curr) => {
      if (!curr) return makeProject("Imported Files", "javascript");
      const currentFiles = curr.files || [];
      const newFiles = filesList.map((f, i) => ({
        id: `file-${crypto.randomUUID().substring(0, 8)}`,
        name: f.name,
        content: f.content,
        isEntry: currentFiles.length === 0 && i === 0,
      }));
      const nextProj = {
        ...curr,
        files: [...currentFiles, ...newFiles],
        openFileIds: [...(curr.openFileIds || []), ...newFiles.map((f) => f.id)],
        activeFileId: newFiles[0]?.id || curr.activeFileId,
        updatedAt: new Date().toISOString(),
      };
      persistProject(nextProj);
      return nextProj;
    });
    showToast(`Added ${filesList.length} file(s) to project.`, "success");
  }, [persistProject, showToast]);

  const addProjectFile = useCallback((fileName, targetProjId = null) => {
    if (!fileName) return;

    const targetId = targetProjId || project?.id;
    let targetProj = (projects || []).find((p) => p.id === targetId);
    if (!targetProj && project?.id === targetId) {
      targetProj = project;
    }
    const projLang = targetProj?.language || project?.language || "python";
    const meta = languageMeta[projLang] || languageMeta.python;
    const ext = meta.extension || "py";
    const finalFileName = fileName.includes(".") ? fileName : `${fileName}.${ext}`;

    const lang = getFileLanguage(finalFileName, projLang);
    const starter = starterCode[lang] || "";
    const newFile = {
      id: `file-${crypto.randomUUID().substring(0, 8)}`,
      name: finalFileName,
      content: starter,
      isEntry: false,
    };

    setProjects((prevProjects) => {
      const list = prevProjects || [];
      return list.map((p) => {
        if (p.id === targetId) {
          const files = p.files || [];
          const updated = {
            ...p,
            files: [...files, newFile],
            openFileIds: [...(p.openFileIds || []), newFile.id],
            activeFileId: newFile.id,
            updatedAt: new Date().toISOString(),
          };
          persistProject(updated);
          return updated;
        }
        return p;
      });
    });

    setProject((curr) => {
      const activeIsTarget = !targetProjId || curr?.id === targetProjId;
      if (activeIsTarget && curr) {
        const nextProj = {
          ...curr,
          files: [...(curr.files || []), newFile],
          openFileIds: [...(curr.openFileIds || []), newFile.id],
          activeFileId: newFile.id,
          updatedAt: new Date().toISOString(),
        };
        persistProject(nextProj);
        try {
          localStorage.setItem(ACTIVE_KEY, nextProj.id);
        } catch (_e) {}
        return nextProj;
      } else if (targetProj) {
        const ensured = ensureProjectFiles(targetProj);
        const nextProj = {
          ...ensured,
          files: [...(ensured.files || []), newFile],
          openFileIds: [...(ensured.openFileIds || []), newFile.id],
          activeFileId: newFile.id,
          updatedAt: new Date().toISOString(),
        };
        persistProject(nextProj);
        try {
          localStorage.setItem(ACTIVE_KEY, nextProj.id);
        } catch (_e) {}
        return nextProj;
      }
      return curr;
    });

    showToast(`Created subfile "${finalFileName}".`, "success");
    return newFile;
  }, [persistProject, project, projects, showToast]);

  const selectProjectFile = useCallback((fileId) => {
    setProject((current) => {
      if (!current) return current;
      const ensured = ensureProjectFiles(current);
      const target = (ensured.files || []).find((f) => f.id === fileId);
      if (!target) return current;
      const targetLang = getFileLanguage(target.name, ensured.language);
      const openIds = ensured.openFileIds || [];
      const updatedOpen = openIds.includes(fileId) ? openIds : [...openIds, fileId];
      const nextProj = {
        ...ensured,
        language: targetLang || ensured.language,
        activeFileId: fileId,
        openFileIds: updatedOpen,
      };
      persistProject(nextProj);
      return nextProj;
    });
  }, [persistProject]);

  const closeEditorTab = useCallback((fileId) => {
    setProject((current) => {
      if (!current) return current;
      const openIds = (current.openFileIds || []).filter((id) => id !== fileId);
      let nextActive = current.activeFileId;
      if (nextActive === fileId) {
        nextActive = openIds[openIds.length - 1] || current.files?.[0]?.id || null;
      }
      return {
        ...current,
        openFileIds: openIds,
        activeFileId: nextActive,
      };
    });
  }, []);

  const deleteProjectFile = useCallback((fileId, targetProjId = null) => {
    const projId = targetProjId || project?.id;
    setProjects((prev) =>
      (prev || []).map((p) => {
        if (p.id === projId) {
          const remainingFiles = (p.files || []).filter((f) => f.id !== fileId);
          const remainingOpenIds = (p.openFileIds || []).filter((id) => id !== fileId);
          const nextActiveId = p.activeFileId === fileId ? remainingFiles[0]?.id : p.activeFileId;
          const updated = {
            ...p,
            files: remainingFiles,
            openFileIds: remainingOpenIds.length > 0 ? remainingOpenIds : [remainingFiles[0]?.id],
            activeFileId: nextActiveId,
            updatedAt: new Date().toISOString(),
          };
          persistProject(updated);
          return updated;
        }
        return p;
      })
    );

    setProject((current) => {
      if (!current || (current.id !== projId && targetProjId)) return current;
      if ((current.files || []).length <= 1) {
        showToast("Cannot delete the only file in a project.", "warning");
        return current;
      }
      const target = current.files.find((f) => f.id === fileId);
      const remainingFiles = current.files.filter((f) => f.id !== fileId);
      const remainingOpenIds = (current.openFileIds || []).filter((id) => id !== fileId);
      const nextActiveId = current.activeFileId === fileId ? remainingFiles[0]?.id : current.activeFileId;

      const nextProj = {
        ...current,
        files: remainingFiles,
        openFileIds: remainingOpenIds.length > 0 ? remainingOpenIds : [remainingFiles[0]?.id],
        activeFileId: nextActiveId,
        updatedAt: new Date().toISOString(),
      };
      persistProject(nextProj);
      showToast(`Deleted file "${target?.name || "file"}".`, "info");
      return nextProj;
    });
  }, [persistProject, project?.id, showToast]);

  const renameProjectFile = useCallback((fileId, newName, targetProjId = null) => {
    if (!newName) return;
    const projId = targetProjId || project?.id;
    setProjects((prev) =>
      (prev || []).map((p) => {
        if (p.id === projId) {
          const updatedFiles = (p.files || []).map((f) => (f.id === fileId ? { ...f, name: newName } : f));
          const updated = { ...p, files: updatedFiles, updatedAt: new Date().toISOString() };
          persistProject(updated);
          return updated;
        }
        return p;
      })
    );
    setProject((current) => {
      if (!current || (current.id !== projId && targetProjId)) return current;
      const updatedFiles = (current.files || []).map((f) =>
        f.id === fileId ? { ...f, name: newName } : f
      );
      const nextProj = {
        ...current,
        files: updatedFiles,
        updatedAt: new Date().toISOString(),
      };
      persistProject(nextProj);
      return nextProj;
    });
  }, [persistProject, project?.id]);

  const switchToFile = useCallback((projectIdOrFileId, fileId = null) => {
    if (fileId) {
      const targetProj = projects.find((p) => p.id === projectIdOrFileId);
      if (targetProj) {
        const ensured = ensureProjectFiles(targetProj);
        const openIds = Array.isArray(ensured.openFileIds) ? ensured.openFileIds : [];
        const updatedOpen = openIds.includes(fileId) ? openIds : [...openIds, fileId];
        const targetFile = ensured.files?.find((f) => f.id === fileId);
        const targetLang = targetFile ? getFileLanguage(targetFile.name, ensured.language) : ensured.language;
        const nextProj = {
          ...ensured,
          language: targetLang,
          activeFileId: fileId,
          openFileIds: updatedOpen,
        };
        setProject(nextProj);
        persistProject(nextProj);
        try {
          localStorage.setItem(ACTIVE_KEY, nextProj.id);
        } catch (_e) {}
        return;
      }
    }

    const targetProj = projects.find((p) => p.id === projectIdOrFileId);
    if (targetProj) {
      const ensured = ensureProjectFiles(targetProj);
      const activeFileObj = (ensured.files || []).find((f) => f.id === ensured.activeFileId) || ensured.files?.[0];
      const targetLang = activeFileObj ? getFileLanguage(activeFileObj.name, ensured.language) : ensured.language;
      const nextProj = {
        ...ensured,
        language: targetLang,
      };
      setProject(nextProj);
      persistProject(nextProj);
      try {
        localStorage.setItem(ACTIVE_KEY, nextProj.id);
      } catch (_e) {}
      return;
    }

    selectProjectFile(projectIdOrFileId);
  }, [projects, persistProject, selectProjectFile]);

  const createIndividualFile = useCallback((fileName, content = null, lang = null) => {
    if (!fileName) return null;
    const detectedLang = lang || getFileLanguage(fileName, "python");
    const starter = content !== null ? content : (starterCode[detectedLang] || "");
    const fileId = `file-${crypto.randomUUID().substring(0, 8)}`;
    const newFile = {
      id: fileId,
      name: fileName,
      content: starter,
      isEntry: true,
    };
    const newProj = {
      id: `proj-${crypto.randomUUID().substring(0, 8)}`,
      name: fileName,
      language: detectedLang,
      [detectedLang]: starter,
      isSingleFile: true,
      activeFileId: fileId,
      openFileIds: [fileId],
      files: [newFile],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...(prev || [])]);
    setProject(newProj);
    persistProject(newProj);
    try {
      localStorage.setItem(ACTIVE_KEY, newProj.id);
    } catch (_e) {}
    showToast(`Created file "${fileName}".`, "success");
    return newProj;
  }, [persistProject, showToast]);

  const openCreateFileDialog = useCallback((mode = "file", lang = null) => {
    const activeFileObj = project?.files?.find((f) => f.id === project?.activeFileId);
    const currentLang = lang || (activeFileObj ? getFileLanguage(activeFileObj.name, null) : project?.language) || "python";
    setProjectDialogMode(mode);
    setProjectDialogLang(currentLang);
    setProjectDialogOpen(true);
  }, [project]);

  const openNewFileInput = useCallback((mode = "file", lang = null) => {
    openCreateFileDialog(mode, lang);
  }, [openCreateFileDialog]);

  // Execution Runner: sends code to backend and streams output
  const runCode = useCallback(async () => {
    if (isRunning) return;

    if (!project) {
      showToast("Please select a language or file to run code.", "warning");
      return;
    }

    setIsRunning(true);
    setIsWaitingForInput(false);
    setActivePrompt("");
    clearTerminal();

    const ensured = ensureProjectFiles(project);
    const activeFileObj = ensured.files?.find((f) => f.id === ensured.activeFileId) || ensured.files?.[0];
    const activeFileName = activeFileObj?.name || "";
    const activeFileLang = activeFileObj ? getFileLanguage(activeFileObj.name, null) : project?.language;

    const language = activeFileLang || project?.language || "python";
    const code = activeFileObj?.content ?? (project && project[language] ? project[language] : "") ?? "";
    const projectFiles = (ensured.files || []).map((f) => ({
      name: f.name,
      content: f.content,
      isEntry: f.id === activeFileObj?.id || f.isEntry,
    }));

    setOutput({
      status: language === "java" ? "COMPILING" : "RUNNING",
      compilationStatus: language === "java" ? "COMPILING" : null,
      executionStatus: language === "java" ? null : "RUNNING",
      output: "",
      error: null,
      executionTime: null,
      memoryUsage: null,
      exitCode: null,
      type: "loading",
      value: language === "java" ? "Compiling and running..." : "Running program...",
    });

    if (["html", "css"].includes(language)) {
      setOutput({
        status: "SUCCESS",
        compilationStatus: "SUCCESS",
        executionStatus: "SUCCESS",
        output: `${language.toUpperCase()} rendered successfully in preview panel.`,
        error: null,
        executionTime: 0,
        memoryUsage: null,
        exitCode: 0,
        type: "success",
        value: `${language.toUpperCase()} rendered successfully in preview panel.`,
      });
      setIsRunning(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await executeCode(language, code, stdin || "", {
        signal: controller.signal,
      });

      const isSuccess = res.status === "SUCCESS" || res.success;
      const finalOutput = res.output !== undefined && res.output !== null ? res.output : "";
      const finalError = res.error || null;

      setOutput({
        status: res.status || (isSuccess ? "SUCCESS" : "RUNTIME_ERROR"),
        compilationStatus: res.compilationStatus || (res.status === "COMPILATION_ERROR" ? "COMPILATION_ERROR" : "SUCCESS"),
        executionStatus: res.executionStatus || (isSuccess ? "SUCCESS" : "RUNTIME_ERROR"),
        output: finalOutput,
        error: finalError,
        executionTime: res.executionTime !== undefined ? res.executionTime : null,
        memoryUsage: res.memoryUsage || null,
        exitCode: res.exitCode !== undefined ? res.exitCode : (isSuccess ? 0 : 1),
        type: isSuccess ? "success" : "error",
        value: finalOutput || finalError || "",
      });
    } catch (httpErr) {
      if (httpErr.name === "CanceledError" || httpErr.code === "ERR_CANCELED") {
        return;
      }
      const errMessage = httpErr.response?.data?.error || httpErr.message || "Failed to execute code";
      setOutput({
        status: httpErr.response?.data?.status || "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: errMessage,
        executionTime: null,
        memoryUsage: null,
        exitCode: 1,
        type: "error",
        value: errMessage,
      });
    } finally {
      setIsRunning(false);
      setIsWaitingForInput(false);
      setActivePrompt("");
      abortControllerRef.current = null;
    }
  }, [isRunning, project, clearTerminal, stdin, showToast]);

  const value = {
    // Navigation
    activeNav,
    setActiveNav,

    // P0 Compiler State
    projects,
    project,
    activeFile,
    setLanguage,
    updateCode,
    resetCurrentFile,
    stdin,
    setStdin,
    clearStdin,
    output,
    clearOutput,
    isRunning,
    runCode,
    runInteractiveCode: runCode,
    stopExecution,

    // File Explorer & Workspaces
    isProjectDialogOpen,
    setProjectDialogOpen,
    projectDialogMode,
    setProjectDialogMode,
    projectDialogLang,
    setProjectDialogLang,
    openCreateFileDialog,
    createProject,
    openProject,
    renameProject,
    deleteProject,
    importProject,
    importLocalFolder,
    importLocalFiles,
    addProjectFile,
    deleteProjectFile,
    renameProjectFile,
    selectProjectFile,
    closeEditorTab,
    isFileExplorerOpen,
    setIsFileExplorerOpen,
    isAddingFile,
    setIsAddingFile,
    openNewFileInput,
    createIndividualFile,
    switchToFile,

    // Terminal Streaming
    terminalHistory,
    activePrompt,
    isWaitingForInput,
    sendTerminalInput,
    clearTerminal,

    // Fullscreen Workspace
    isFullscreen,
    toggleFullscreen,
    setIsFullscreen,

    // Confirmation Modals (Clear, Reset, etc.)
    confirmModal,
    openConfirmModal,
    closeConfirmModal,

    // Preferences & Settings
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    resetPreferences,
    editorSettings,
    updateEditorSettings,
    compilerSettings,
    updateCompilerSettings,
    notificationSettings,
    updateNotificationSettings,
    toast,
    showToast,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isSettingsOpen,
    setSettingsOpen,
    targetErrorLine,
    jumpToErrorLine,

    // Profile & Notifications
    profile,
    updateProfile,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,

    // Real Language Availability
    availableRuntimes,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used inside EditorProvider");
  return context;
}
