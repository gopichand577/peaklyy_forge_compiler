import MonacoEditor from "@monaco-editor/react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCode,
  FilePlus,
  FileUp,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  FolderUp,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFileLanguage, languageMeta, useEditor } from "../../context/EditorContext";
import { defineMonacoTheme } from "../../utils/monacoTheme";
import LanguageIcon from "../common/LanguageIcon";

export default function Editor() {
  const {
    project,
    projects,
    setLanguage,
    updateCode,
    activeFile,
    addProjectFile,
    createIndividualFile,
    switchToFile,
    deleteProject,
    deleteProjectFile,
    importLocalFolder,
    importLocalFiles,
    closeEditorTab,
    renameProjectFile,
    renameProject,
    selectProjectFile,
    setProjectDialogOpen,
    openCreateFileDialog,
    isFileExplorerOpen,
    setIsFileExplorerOpen,
    isAddingFile,
    setIsAddingFile,
    editorSettings,
    isFullscreen,
    toggleFullscreen,
    setSettingsOpen,
    targetErrorLine,
    theme,
  } = useEditor();

  const [expandedProjects, setExpandedProjects] = useState(() => ({ [project?.id || "default"]: true }));
  const [targetProjectForNewFile, setTargetProjectForNewFile] = useState(null);
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState("");
  const editorRef = useRef(null);
  const tabsListRef = useRef(null);
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const allWorkspaces = useMemo(() => {
    const existing = Array.isArray(projects) ? projects.filter(Boolean) : [];
    if (!project) return existing;
    const currentEnsured = {
      ...project,
      name: project.isSingleFile ? (project.files?.[0]?.name || project.name) : project.name,
      files: project.files || [],
    };
    const hasCurrent = existing.some((p) => p && p.id === currentEnsured.id);
    const merged = hasCurrent
      ? existing.map((p) => (p && p.id === currentEnsured.id ? currentEnsured : p))
      : [currentEnsured, ...existing];
    return merged.filter(Boolean);
  }, [project, projects]);

  const projectFolders = useMemo(() => allWorkspaces.filter((p) => !p.isSingleFile), [allWorkspaces]);
  const standaloneSingleFiles = useMemo(() => allWorkspaces.filter((p) => Boolean(p.isSingleFile)), [allWorkspaces]);

  // Count of total files across all workspaces
  const totalFilesCount = useMemo(() => {
    let count = 0;
    for (const ws of allWorkspaces) {
      if (ws.files && Array.isArray(ws.files)) {
        count += ws.files.length;
      } else {
        count += 1;
      }
    }
    return count;
  }, [allWorkspaces]);

  const files = project?.files || [];
  const openFileIds = Array.isArray(project?.openFileIds) ? project.openFileIds : files.map((f) => f.id);
  const openFiles = files.filter((f) => openFileIds.includes(f.id));
  const displayTabs = openFiles;

  const activeLanguage = getFileLanguage(activeFile?.name, project?.language || "plaintext");

  // Auto scroll active tab smoothly into view when active tab changes
  useEffect(() => {
    if (tabsListRef.current) {
      const activeTabEl = tabsListRef.current.querySelector(".editor-tab.active");
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [activeFile?.id, project?.activeFileId]);

  // Handle Monaco Editor mount and target line navigation
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (targetErrorLine && editorRef.current) {
      const { line, col } = targetErrorLine;
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: col || 1 });
      editorRef.current.focus();
    }
  }, [targetErrorLine]);

  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    const cleanInput = newFileNameInput.trim();
    if (!cleanInput) return;

    if (targetProjectForNewFile) {
      // Subfile creation inside a specific project folder
      addProjectFile(cleanInput, targetProjectForNewFile);
    } else {
      // Standalone individual file creation (from '+' beside EXPLORER)
      createIndividualFile(cleanInput);
    }

    setNewFileNameInput("");
    setIsAddingFile(false);
    setTargetProjectForNewFile(null);
  };

  const handleStartRename = (e, file) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  };

  const handleSaveRename = (e, fileId, parentProjId = null) => {
    e?.stopPropagation();
    const trimmed = editingFileName.trim();
    if (trimmed) {
      if (parentProjId && parentProjId !== project?.id) {
        renameProject(parentProjId, trimmed);
      } else {
        renameProjectFile(fileId, trimmed);
        if (project?.isSingleFile && project?.id) {
          renameProject(project.id, trimmed);
        }
      }
    }
    setEditingFileId(null);
  };

  const toggleProjectExpand = (e, projId) => {
    e.stopPropagation();
    setExpandedProjects((prev) => ({
      ...prev,
      [projId]: prev[projId] === undefined ? false : !prev[projId],
    }));
  };

  const handleFolderUploadClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
      folderInputRef.current.click();
    }
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFolderInputChange = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    const firstRel = fileList[0].webkitRelativePath || "";
    const folderName = firstRel ? firstRel.split("/")[0] : "Imported Folder";

    const parsedFiles = [];
    for (const f of fileList) {
      if (f.name === ".DS_Store" || f.name === "Thumbs.db") continue;
      if (f.webkitRelativePath && (f.webkitRelativePath.includes("node_modules/") || f.webkitRelativePath.includes(".git/"))) continue;

      try {
        const text = await f.text();
        const pathParts = f.webkitRelativePath ? f.webkitRelativePath.split("/").slice(1).join("/") : f.name;
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
    }
  };

  const handleFileInputChange = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    const parsedFiles = [];
    for (const f of fileList) {
      if (f.name === ".DS_Store" || f.name === "Thumbs.db") continue;
      try {
        const text = await f.text();
        parsedFiles.push({
          name: f.name,
          content: text,
        });
      } catch (err) {
        console.warn("Could not read file:", f.name, err);
      }
    }

    if (parsedFiles.length > 0) {
      importLocalFiles(parsedFiles, targetProjectForNewFile);
    }
  };

  return (
    <section
      className={`panel editor-card ${isFullscreen ? "in-fullscreen-workspace" : ""}`}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
      }}
    >
      {/* Hidden file & folder import inputs */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: "none" }}
        onChange={handleFolderInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Editor Tabs Header */}
      <div className="panel-header editor-tabs-header">
        <div
          className="editor-tabs-left-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            className={`file-explorer-toggle-btn ${isFileExplorerOpen ? "active" : ""}`}
            onClick={() => setIsFileExplorerOpen((prev) => !prev)}
            title="Toggle File Explorer"
          >
            <FolderTree size={14} />
            <span>Files ({totalFilesCount})</span>
          </button>

          {/* Horizontally Scrollable Tabs Bar with Wheel & Drag support */}
          <div
            className="editor-tabs-list"
            ref={tabsListRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {displayTabs.map((file) => {
              const isActive = file.id === (project?.activeFileId || activeFile?.id);
              return (
                <div
                  key={file.id}
                  className={`editor-tab ${isActive ? "active" : ""}`}
                  onClick={() => selectProjectFile(file.id)}
                  title={file.name}
                >
                  <FileCode size={13} style={{ opacity: 0.7 }} />
                  <span>{file.name}</span>
                  {displayTabs.length > 1 && (
                    <button
                      type="button"
                      className="tab-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeEditorTab(file.id);
                      }}
                      title={`Close ${file.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="editor-new-tab-btn"
              onClick={() => openCreateFileDialog("file")}
              title="New File (+)"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div
          className="editor-tabs-right-group"
          style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}
        >
          <div className="auto-saved-badge">
            <span className="dot" />
            <span>Auto saved</span>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => setSettingsOpen(true)}
            title="IDE Preferences (Ctrl+,)"
          >
            <Settings size={14} />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode (F11)"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Editor Body + Side File Explorer */}
      <div className="editor-body-area" style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* File Explorer Side Drawer */}
        {isFileExplorerOpen && (
          <aside className="file-explorer-drawer">
            <div className="explorer-header">
              <div className="explorer-title">
                <FolderTree size={14} className="text-red" />
                <span>EXPLORER</span>
              </div>
              <div className="explorer-header-actions" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <button
                  type="button"
                  className="explorer-add-btn"
                  onClick={() => openCreateFileDialog("file")}
                  title="New File"
                >
                  <FilePlus size={15} />
                </button>
                <button
                  type="button"
                  className="explorer-add-btn"
                  onClick={() => openCreateFileDialog("project")}
                  title="New Project Folder"
                >
                  <FolderPlus size={15} />
                </button>
              </div>
            </div>

            {/* Quick Inline New Standalone File Form (Only for Root Level files) */}
            {isAddingFile && !targetProjectForNewFile && (
              <form onSubmit={handleCreateFileSubmit} className="explorer-new-file-form">
                <input
                  type="text"
                  placeholder="e.g. script.py (single file)..."
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingFile(false);
                      setTargetProjectForNewFile(null);
                    }
                  }}
                  className="explorer-file-input"
                  autoFocus
                />
                <button type="submit" className="explorer-save-file-btn" title="Create Single File">
                  <Check size={12} />
                </button>
              </form>
            )}

            {/* VS Code Style Multi-Project Hierarchy & Standalone Files */}
            <div className="explorer-file-tree">
              {/* All Project Folders */}
              {projectFolders.map((proj) => {
                const isExpanded = expandedProjects[proj.id] !== false;
                const projFiles = proj.files || [];
                const isProjActive = project?.id === proj.id;
                const isAddingSubfileToThis = isAddingFile && targetProjectForNewFile === proj.id;

                return (
                  <div key={proj.id} className="explorer-project-section">
                    <div
                      className={`explorer-project-root-item ${isProjActive ? "project-active-root" : ""}`}
                      onClick={(e) => toggleProjectExpand(e, proj.id)}
                      title={`Project: ${proj.name}`}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="folder-chevron" />
                      ) : (
                        <ChevronRight size={14} className="folder-chevron" />
                      )}
                      {isExpanded ? (
                        <FolderOpen size={15} className="project-root-icon text-red" />
                      ) : (
                        <Folder size={15} className="project-root-icon text-red" />
                      )}
                      <span className="project-root-name">{proj.name}</span>
                      <span className="project-root-badge">{projFiles.length}</span>

                      {/* Add Subfile button directly on Project folder */}
                      <button
                        type="button"
                        className="explorer-subfile-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetProjectForNewFile(proj.id);
                          setExpandedProjects((prev) => ({ ...prev, [proj.id]: true }));
                          setNewFileNameInput("");
                          setIsAddingFile(true);
                        }}
                        title={`Add subfile to ${proj.name}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Sub-Directory Files inside this project folder */}
                    {isExpanded && (
                      <div className="explorer-sub-directory-tree">
                        {/* Inline subfile creation input directly inside this subfolder */}
                        {isAddingSubfileToThis && (
                          <form
                            onSubmit={handleCreateFileSubmit}
                            className="explorer-new-file-form subfile-inline-form"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              placeholder={`e.g. utils.${languageMeta[proj.language]?.extension || "py"} (subfile in ${proj.name})...`}
                              value={newFileNameInput}
                              onChange={(e) => setNewFileNameInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setIsAddingFile(false);
                                  setTargetProjectForNewFile(null);
                                  setNewFileNameInput("");
                                }
                              }}
                              className="explorer-file-input subfile-input"
                              autoFocus
                            />
                            <button type="submit" className="explorer-save-file-btn" title="Create Subfile">
                              <Check size={12} />
                            </button>
                          </form>
                        )}
                        {projFiles.map((file) => {
                          const isFileActive = isProjActive && file.id === (project?.activeFileId || activeFile?.id);
                          const isEditing = editingFileId === file.id;

                          return (
                            <div
                              key={file.id}
                              className={`explorer-file-item ${isFileActive ? "active" : ""}`}
                              onClick={() => switchToFile(proj.id, file.id)}
                              title={file.name}
                            >
                              <FileCode size={14} className="file-item-icon" />

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingFileName}
                                  onChange={(e) => setEditingFileName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveRename(e, file.id, proj.id);
                                    if (e.key === "Escape") setEditingFileId(null);
                                  }}
                                  className="explorer-rename-input"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="file-item-name">{file.name}</span>
                              )}

                              {file.isEntry && <span className="entry-tag">main</span>}

                              <div className="file-item-actions">
                                {!isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      className="file-action-icon"
                                      onClick={(e) => handleStartRename(e, file)}
                                      title="Rename File"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    {projFiles.length > 1 && (
                                      <button
                                        type="button"
                                        className="file-action-icon delete"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteProjectFile(file.id, proj.id);
                                        }}
                                        title={`Delete ${file.name}`}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* All Standalone Individual Files (Root Level, NO Folder Wrapping) */}
              {standaloneSingleFiles.map((sFile) => {
                const isSingleActive = project?.id === sFile.id;
                const sFiles =
                  sFile.files && sFile.files.length > 0
                    ? sFile.files
                    : [{ id: sFile.id, name: sFile.name, content: "" }];

                return sFiles.map((file) => {
                  const isFileActive = isSingleActive && file.id === (project?.activeFileId || activeFile?.id);
                  const isEditing = editingFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className={`explorer-file-item standalone-root-file ${isFileActive ? "active" : ""}`}
                      onClick={() => switchToFile(sFile.id, file.id)}
                      title={file.name}
                    >
                      <FileCode size={14} className="file-item-icon" />

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(e, file.id, sFile.id);
                            if (e.key === "Escape") setEditingFileId(null);
                          }}
                          className="explorer-rename-input"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="file-item-name">{file.name}</span>
                      )}

                      {file.isEntry && <span className="entry-tag">main</span>}

                      <div className="file-item-actions">
                        {!isEditing && (
                          <>
                            <button
                              type="button"
                              className="file-action-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFileId(file.id);
                                setEditingFileName(file.name);
                              }}
                              title="Rename File"
                            >
                              <Pencil size={12} />
                            </button>
                            {sFiles.length > 1 && (
                              <button
                                type="button"
                                className="file-action-icon delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProjectFile(file.id, sFile.id);
                                }}
                                title={`Delete ${file.name}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </aside>
        )}

        {/* Monaco Editor Container */}
        <div className="editor-wrap" style={{ flex: 1, minHeight: 0 }}>
          <MonacoEditor
            height="100%"
            theme={theme === "light" ? "vs" : "peaklyy-dark"}
            language={activeLanguage}
            path={activeFile && project ? `file:///${project.id}/${activeFile.id}/${activeFile.name}` : undefined}
            keepCurrentModel={true}
            value={activeFile?.content ?? ""}
            beforeMount={defineMonacoTheme}
            onMount={handleEditorDidMount}
            onChange={updateCode}
            options={{
              fontSize: editorSettings.fontSize || 14,
              tabSize: editorSettings.tabSize || 4,
              wordWrap: editorSettings.wordWrap || "on",
              minimap: { enabled: Boolean(editorSettings.minimap) },
              lineNumbers: editorSettings.lineNumbers || "on",
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
            }}
          />
        </div>
      </div>
    </section>
  );
}
