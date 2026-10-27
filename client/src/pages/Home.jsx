import { Download, FolderOpen, Minimize2, Plus, Upload } from "lucide-react";
import React, { useEffect, useRef } from "react";
import CommandPalette from "../components/common/CommandPalette";
import ConfirmModal from "../components/common/ConfirmModal";
import LanguageIcon from "../components/common/LanguageIcon";
import SettingsModal from "../components/common/SettingsModal";
import { ColumnSplitter, RowSplitter } from "../components/common/SplitterHandle";
import Toast from "../components/common/Toast";
import Output from "../components/console/Output";
import Editor from "../components/editor/Editor";
import LanguageSelector from "../components/editor/LanguageSelector";
import RunButton from "../components/editor/RunButton";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Preview from "../components/preview/Preview";
import ProfileView from "../components/profile/ProfileView";
import ProjectModal from "../components/projects/ProjectModal";
import SettingsView from "../components/settings/SettingsView";
import { getFileLanguage, useEditor } from "../context/EditorContext";
import { useResizable } from "../utils/useResizable";
import "../App.css";

export default function Home() {
  const {
    activeNav,
    project,
    activeFile,
    runCode,
    setProjectDialogOpen,
    importProject,
    importLocalFolder,
    setCommandPaletteOpen,
    setSettingsOpen,
    showToast,
    isFullscreen,
    toggleFullscreen,
    confirmModal,
    closeConfirmModal,
  } = useEditor();

  const uploadRef = useRef(null);
  const folderUploadRef = useRef(null);

  // Normal Compiler Splitters
  const {
    split: compilerSplitX,
    startResize: startCompilerResizeX,
    resetSplit: resetCompilerSplitX,
    containerRef: compilerWorkspaceRef,
    isDragging: isDraggingCompilerX,
  } = useResizable({
    initialSplit: 55,
    min: 25,
    max: 75,
    direction: "horizontal",
    storageKey: "peaklyy-compiler-split-x",
  });

  const {
    split: compilerSplitY,
    startResize: startCompilerResizeY,
    resetSplit: resetCompilerSplitY,
    containerRef: compilerMainRef,
    isDragging: isDraggingCompilerY,
  } = useResizable({
    initialSplit: 62,
    min: 25,
    max: 82,
    direction: "vertical",
    storageKey: "peaklyy-compiler-split-y",
  });

  // Fullscreen Compiler Splitters
  const {
    split: fullscreenSplitX,
    startResize: startFullscreenResizeX,
    resetSplit: resetFullscreenSplitX,
    containerRef: fullscreenWorkspaceRef,
    isDragging: isDraggingFullscreenX,
  } = useResizable({
    initialSplit: 60,
    min: 30,
    max: 75,
    direction: "horizontal",
    storageKey: "peaklyy-fullscreen-split-x",
  });

  const {
    split: fullscreenSplitY,
    startResize: startFullscreenResizeY,
    resetSplit: resetFullscreenSplitY,
    containerRef: fullscreenRightColRef,
    isDragging: isDraggingFullscreenY,
  } = useResizable({
    initialSplit: 48,
    min: 25,
    max: 75,
    direction: "vertical",
    storageKey: "peaklyy-fullscreen-split-y",
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        showToast("Project saved.", "success");
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runCode();
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "p"))
      ) {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
      if (event.key === "F11") {
        event.preventDefault();
        toggleFullscreen();
      }
      if (event.key === "Escape") {
        if (confirmModal.isOpen) {
          closeConfirmModal();
        } else {
          setCommandPaletteOpen(false);
          setSettingsOpen(false);
          setProjectDialogOpen(false);
          if (isFullscreen) {
            toggleFullscreen();
          }
        }
      }
    };

    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [
    runCode,
    setCommandPaletteOpen,
    setSettingsOpen,
    setProjectDialogOpen,
    showToast,
    confirmModal.isOpen,
    closeConfirmModal,
    isFullscreen,
    toggleFullscreen,
  ]);

  const download = () => {
    if (!project) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(project, null, 2)], { type: "application/json" })
    );
    link.download = `${
      (project.name || "peaklyy-project").replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    }.peaklyy.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importProject(JSON.parse(await file.text()));
    } catch (e) {
      window.alert("That file isn’t a valid Peaklyy Forge project.");
    }
    event.target.value = "";
  };

  const handleFolderUpload = async (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    const firstRel = fileList[0].webkitRelativePath || "";
    const folderName = firstRel ? firstRel.split("/")[0] : "Imported Project";

    const parsedFiles = [];
    for (const f of fileList) {
      if (f.name === ".DS_Store" || f.name === "Thumbs.db") continue;
      if (
        f.webkitRelativePath &&
        (f.webkitRelativePath.includes("node_modules/") ||
          f.webkitRelativePath.includes(".git/") ||
          f.webkitRelativePath.includes(".vscode/"))
      )
        continue;

      try {
        const text = await f.text();
        const pathParts = f.webkitRelativePath
          ? f.webkitRelativePath.split("/").slice(1).join("/")
          : f.name;
        parsedFiles.push({
          name: pathParts || f.name,
          content: text,
        });
      } catch (err) {
        console.warn("Could not read file:", f.name, err);
      }
    }

    if (parsedFiles.length > 0) {
      importLocalFolder(folderName, parsedFiles);
    } else {
      showToast("No readable files found in the selected folder.", "warning");
    }
    event.target.value = "";
  };

  return (
    <div className="forge-root-layout">
      {/* Fullscreen Compiler Workstation */}
      {isFullscreen && (
        <div className="fullscreen-compiler-overlay" role="dialog" aria-label="Fullscreen Compiler Mode">
          <header className="fullscreen-top-toolbar">
            <div className="fullscreen-toolbar-left">
              <button
                type="button"
                className="fullscreen-exit-btn"
                onClick={toggleFullscreen}
                title="Exit Fullscreen (Esc or F11)"
              >
                <Minimize2 size={15} />
                <span>Exit Fullscreen</span>
              </button>

              <div className="fullscreen-divider-line" />

              <span className="fullscreen-project-title">
                {project?.name || "Peaklyy Workspace"}
              </span>

              {activeFile && (
                <span className="fullscreen-active-file-pill">
                  <LanguageIcon language={getFileLanguage(activeFile.name, project?.language)} size={14} />
                  <span>{activeFile.name}</span>
                </span>
              )}
            </div>

            <div className="fullscreen-toolbar-right">
              <LanguageSelector />
              <RunButton />
            </div>
          </header>

          <main
            className={`fullscreen-workspace-split ${
              isDraggingFullscreenX || isDraggingFullscreenY ? "is-resizing-active" : ""
            }`}
            ref={fullscreenWorkspaceRef}
          >
            {/* Left Side: Code Editor (Largest workspace area) */}
            <section
              className="fullscreen-pane-editor"
              style={{ width: `calc(${fullscreenSplitX}% - 5px)` }}
            >
              <Editor />
            </section>

            <ColumnSplitter
              isDragging={isDraggingFullscreenX}
              onStart={startFullscreenResizeX}
              onReset={resetFullscreenSplitX}
              title="Drag to resize Editor and Console Columns"
            />

            {/* Right Side: Input Top + Output Bottom */}
            <aside
              className="fullscreen-pane-side"
              ref={fullscreenRightColRef}
              style={{ width: `calc(${100 - fullscreenSplitX}% - 5px)` }}
            >
              {/* Right Top: Input Console */}
              <div
                className="fullscreen-input-container"
                style={{ height: `calc(${fullscreenSplitY}% - 5px)` }}
              >
                <Preview isFullscreenMode={true} />
              </div>

              <RowSplitter
                isDragging={isDraggingFullscreenY}
                onStart={startFullscreenResizeY}
                onReset={resetFullscreenSplitY}
                title="Drag to resize Input Console and Output Console"
              />

              {/* Right Bottom: Output Console */}
              <div
                className="fullscreen-output-container"
                style={{ height: `calc(${100 - fullscreenSplitY}% - 5px)` }}
              >
                <Output isFullscreenMode={true} />
              </div>
            </aside>
          </main>
        </div>
      )}

      {/* Main Standard View Layout */}
      <Navbar />

      <div className="forge-body-container">
        <Sidebar />

        <main className="forge-main-content">
          {activeNav === "profile" ? (
            <ProfileView />
          ) : activeNav === "settings" ? (
            <SettingsView />
          ) : (
            <div
              className={`compiler-view-wrapper ${
                isDraggingCompilerX || isDraggingCompilerY ? "is-resizing-active" : ""
              }`}
              ref={compilerMainRef}
            >
              <div className="compiler-top-toolbar">
                <div className="toolbar-actions-left">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setProjectDialogOpen(true)}
                    aria-label="Open projects"
                    title="Open Projects"
                  >
                    <FolderOpen size={17} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={download}
                    aria-label="Download project"
                    title="Export JSON"
                  >
                    <Download size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => folderUploadRef.current?.click()}
                    aria-label="Import local folder from system"
                    title="Import Local Folder"
                  >
                    <Upload size={16} />
                  </button>

                  <input
                    ref={folderUploadRef}
                    className="file-upload"
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFolderUpload}
                  />

                  <input
                    ref={uploadRef}
                    className="file-upload"
                    type="file"
                    accept="application/json,.json"
                    onChange={upload}
                  />

                  <button
                    type="button"
                    className="new-button"
                    onClick={() => setProjectDialogOpen(true)}
                    title="Create or Manage Projects (+)"
                  >
                    <Plus size={15} />
                    <span>New</span>
                  </button>
                </div>

                <div className="toolbar-actions-right">
                  <LanguageSelector />
                  <RunButton />
                </div>
              </div>

              <section
                className="compiler-workspace-split"
                ref={compilerWorkspaceRef}
                style={{ height: `calc(${compilerSplitY}% - 5px)` }}
              >
                <div
                  className="compiler-pane-container compiler-editor-pane"
                  style={{ width: `calc(${compilerSplitX}% - 5px)` }}
                >
                  <Editor />
                </div>

                <ColumnSplitter
                  isDragging={isDraggingCompilerX}
                  onStart={startCompilerResizeX}
                  onReset={resetCompilerSplitX}
                  title="Drag to resize Editor and Input/Preview (Double-click to reset 50/50)"
                />

                <div
                  className="compiler-pane-container compiler-preview-pane"
                  style={{ width: `calc(${100 - compilerSplitX}% - 5px)` }}
                >
                  <Preview />
                </div>
              </section>

              <RowSplitter
                isDragging={isDraggingCompilerY}
                onStart={startCompilerResizeY}
                onReset={resetCompilerSplitY}
                title="Drag to resize Workspace and Output Console (Double-click to reset)"
              />

              <section
                className="compiler-console-split"
                style={{ height: `calc(${100 - compilerSplitY}% - 5px)` }}
              >
                <Output />
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ProjectModal />
      <CommandPalette />
      <SettingsModal />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
      <Toast />
    </div>
  );
}
