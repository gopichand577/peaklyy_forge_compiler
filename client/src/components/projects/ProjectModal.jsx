import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Code2,
  FileCode,
  FilePlus,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { TARGET_LANGUAGES, languageMeta } from "../../constants/languages";
import { useEditor } from "../../context/EditorContext";
import LanguageIcon from "../common/LanguageIcon";

const availableLanguages = TARGET_LANGUAGES.map((key) => {
  const meta = languageMeta[key] || {};
  return {
    id: key,
    label: meta.label || key,
    ext: meta.extension || "py",
    color: meta.badgeColor || "#ff3b4a",
  };
});

export default function ProjectModal() {
  const {
    isProjectDialogOpen,
    setProjectDialogOpen,
    projectDialogMode,
    projectDialogLang,
    projects,
    createProject,
    createIndividualFile,
    openProject,
    deleteProject,
    renameProject,
    project: activeProject,
    showToast,
  } = useEditor();

  const [creationMode, setCreationMode] = useState(projectDialogMode || "project"); // 'project' | 'file'
  const [name, setName] = useState("");
  const [selectedLang, setSelectedLang] = useState(projectDialogLang || "python");
  const [searchFilter, setSearchFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Close on Escape key (unless editing a project name)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isProjectDialogOpen) {
        if (editingId) {
          setEditingId(null);
          setEditingName("");
        } else {
          setProjectDialogOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectDialogOpen, setProjectDialogOpen, editingId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isProjectDialogOpen) {
      setName("");
      setCreationMode(projectDialogMode || "project");
      setSelectedLang(projectDialogLang || activeProject?.language || "python");
      setSearchFilter("");
      setEditingId(null);
      setEditingName("");
    }
  }, [isProjectDialogOpen, projectDialogMode, projectDialogLang, activeProject]);

  const filteredProjects = useMemo(() => {
    if (!searchFilter.trim()) return projects;
    const q = searchFilter.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.language?.toLowerCase().includes(q) ||
        (p.files && p.files.some((f) => f.name.toLowerCase().includes(q)))
    );
  }, [projects, searchFilter]);

  if (!isProjectDialogOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (creationMode === "file") {
      const currentMeta = languageMeta[selectedLang] || languageMeta.python;
      const selectedExt = currentMeta.extension || "py";
      let finalFileName = name.trim();
      if (!finalFileName) {
        finalFileName = currentMeta.defaultFileName || `main.${selectedExt}`;
      } else if (!finalFileName.includes(".")) {
        finalFileName = `${finalFileName}.${selectedExt}`;
      }

      // Check for duplicate names
      const existing = projects.find(
        (p) => p?.name?.toLowerCase() === finalFileName.toLowerCase() || (p?.files || []).some((f) => f.name?.toLowerCase() === finalFileName.toLowerCase())
      );

      if (existing) {
        openProject(existing.id);
        setProjectDialogOpen(false);
        showToast(`Opened existing workspace "${finalFileName}".`, "info");
        setName("");
        return;
      }

      createIndividualFile(finalFileName, null, selectedLang);
      setProjectDialogOpen(false);
    } else {
      const currentMeta = languageMeta[selectedLang] || languageMeta.python;
      const finalName = name.trim() || `Untitled ${currentMeta.label || selectedLang} Project`;
      createProject(finalName, selectedLang);
      setProjectDialogOpen(false);
    }
    setName("");
  };

  const handleDelete = (e, projectId) => {
    e.stopPropagation();
    deleteProject(projectId);
    if (editingId === projectId) {
      setEditingId(null);
      setEditingName("");
    }
  };

  const startRename = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const saveRename = (e, projectId) => {
    e?.stopPropagation();
    const trimmed = editingName.trim();
    if (trimmed) {
      renameProject(projectId, trimmed);
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditingName("");
  };

  const formatProjectDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="project-modal-backdrop"
      onMouseDown={() => setProjectDialogOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        className="project-modal-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="project-modal-header">
          <div className="project-modal-title-group">
            <div className="modal-kicker-badge">
              <Sparkles size={13} className="text-red" />
              <span>YOUR WORKSPACE</span>
            </div>
            <h2 id="project-modal-title" className="project-modal-title">
              Projects & Workspaces
            </h2>
            <p className="project-modal-subtitle">
              Create a new coding workspace or manage and open your recent projects.
            </p>
          </div>

          <button
            type="button"
            className="project-modal-close-btn"
            onClick={() => setProjectDialogOpen(false)}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Create Project / File Section */}
        <section className="create-project-section">
          <div className="section-label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {creationMode === "project" ? (
                <FolderPlus size={15} className="text-red" />
              ) : (
                <FilePlus size={15} className="text-red" />
              )}
              <span className="section-label">
                {creationMode === "project" ? "Create New Project" : "Create Individual File"}
              </span>
            </div>

            {/* Mode Toggle Switch */}
            <div className="project-modal-mode-switch" style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "3px", borderRadius: "8px" }}>
              <button
                type="button"
                className={`mode-switch-btn ${creationMode === "project" ? "active" : ""}`}
                onClick={() => setCreationMode("project")}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "none",
                  background: creationMode === "project" ? "var(--primary-color, #ff3b4a)" : "transparent",
                  color: creationMode === "project" ? "#fff" : "var(--muted)",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <FolderPlus size={13} />
                <span>Project</span>
              </button>
              <button
                type="button"
                className={`mode-switch-btn ${creationMode === "file" ? "active" : ""}`}
                onClick={() => setCreationMode("file")}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "none",
                  background: creationMode === "file" ? "var(--primary-color, #ff3b4a)" : "transparent",
                  color: creationMode === "file" ? "#fff" : "var(--muted)",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <FileCode size={13} />
                <span>Single File</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="create-project-form">
            <div className="project-input-wrap">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  creationMode === "project"
                    ? `Name your new ${languageMeta[selectedLang]?.label || selectedLang} project (e.g., My${languageMeta[selectedLang]?.label || "App"})...`
                    : `File name (e.g., main.${languageMeta[selectedLang]?.extension || "py"}, solution.${languageMeta[selectedLang]?.extension || "py"})...`
                }
                className="project-name-input"
                autoFocus
              />
            </div>

            {/* Language Selection Pills */}
            <div className="language-pills-row">
              <span className="pills-label">Language:</span>
              <div className="pills-container">
                {availableLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      className={`lang-pill-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedLang(lang.id)}
                    >
                      <span className="lang-pill-emoji" style={{ display: "flex", alignItems: "center" }}>
                        <LanguageIcon language={lang.id} size={16} />
                      </span>
                      <span className="lang-pill-name">{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="create-actions-row">
              <button type="submit" className="create-submit-btn">
                <Plus size={16} />
                <span>{creationMode === "project" ? "Create & Open Project" : "Create & Open File"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Divider */}
        <div className="modal-section-divider" />

        {/* Recent Projects History Section */}
        <section className="recent-projects-section">
          <div className="recent-section-header">
            <div className="recent-title-group">
              <Clock3 size={16} className="text-red" />
              <h3 className="recent-heading">Recent Projects</h3>
              <span className="recent-count-badge">{projects.length}</span>
            </div>

            {projects.length > 4 && (
              <div className="recent-search-wrap">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter history..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="recent-search-input"
                />
              </div>
            )}
          </div>

          {/* Project List */}
          <div className="project-history-list">
            {filteredProjects.length === 0 ? (
              <div className="empty-projects-state">
                <Code2 size={28} className="empty-icon" />
                <p>
                  {searchFilter
                    ? "No projects match your search filter."
                    : "No saved projects yet. Create your first project above!"}
                </p>
              </div>
            ) : (
              filteredProjects.map((item) => {
                const isActive = item.id === activeProject?.id;
                const isEditing = editingId === item.id;
                const langInfo =
                  availableLanguages.find((l) => l.id === item.language) || {
                    label: item.language || "Code",
                    color: "#888",
                  };

                return (
                  <div
                    key={item.id}
                    className={`project-history-item ${isActive ? "active" : ""} ${
                      isEditing ? "is-editing" : ""
                    }`}
                    onClick={() => {
                      if (!isEditing) openProject(item);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                        openProject(item);
                      }
                    }}
                  >
                    {/* Language Badge */}
                    <div
                      className="project-lang-badge"
                      style={{
                        borderColor: `${langInfo.color}40`,
                        backgroundColor: `${langInfo.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LanguageIcon language={item.language} size={18} />
                    </div>

                    {/* Inline Rename vs Details View */}
                    {isEditing ? (
                      <div
                        className="project-inline-rename-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(e, item.id);
                            if (e.key === "Escape") cancelRename(e);
                          }}
                          className="project-rename-input"
                          autoFocus
                          placeholder="Project name..."
                        />
                        <div className="rename-actions-wrap">
                          <button
                            type="button"
                            className="project-action-btn save-rename-btn"
                            onClick={(e) => saveRename(e, item.id)}
                            title="Save name (Enter)"
                            aria-label="Save project name"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="project-action-btn cancel-rename-btn"
                            onClick={cancelRename}
                            title="Cancel (Esc)"
                            aria-label="Cancel renaming"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="project-info-main">
                        <div className="project-name-row">
                          <span className="project-item-title">{item.name}</span>
                          {isActive && <span className="active-tag">Active</span>}
                        </div>
                        <div className="project-meta-row">
                          <span className="project-meta-lang">{langInfo.label}</span>
                          <span className="meta-separator">•</span>
                          <span className="project-meta-files">
                            {Array.isArray(item.files) ? item.files.length : 1}{" "}
                            {(Array.isArray(item.files) ? item.files.length : 1) === 1 ? "file" : "files"}
                            {item.files && item.files.length > 0
                              ? ` (${item.files.map((f) => f.name).join(", ")})`
                              : ""}
                          </span>
                          <span className="meta-separator">•</span>
                          <span className="project-meta-date">
                            {formatProjectDate(item.updatedAt || item.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions: Rename & Delete Buttons */}
                    {!isEditing && (
                      <div className="project-item-actions">
                        <button
                          type="button"
                          className="project-action-btn project-rename-btn"
                          onClick={(e) => startRename(e, item)}
                          title={`Rename "${item.name}"`}
                          aria-label={`Rename project ${item.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="project-action-btn project-delete-btn"
                          onClick={(e) => handleDelete(e, item.id)}
                          title={`Delete "${item.name}"`}
                          aria-label={`Delete project ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
