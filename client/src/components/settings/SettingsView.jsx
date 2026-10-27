import React, { useState } from "react";
import {
  Bell,
  Code2,
  Download,
  ExternalLink,
  Info,
  Minus,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Trash2,
  Tv,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { RUNNABLE_LANGUAGES, languageMeta } from "../../constants/languages";
import ConfirmModal from "../common/ConfirmModal";
import CustomLanguageSelect from "../common/CustomLanguageSelect";
import CustomSelect from "../common/CustomSelect";

export default function SettingsView() {
  const {
    editorSettings,
    updateEditorSettings,
    compilerSettings,
    updateCompilerSettings,
    notificationSettings,
    updateNotificationSettings,
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    resetPreferences,
    showToast,
  } = useEditor();

  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const ACCENT_COLORS = [
    { name: "Crimson Red", hex: "#ef4444" },
    { name: "Ocean Blue", hex: "#3b82f6" },
    { name: "Cyan Spark", hex: "#06b6d4" },
    { name: "Emerald Green", hex: "#10b981" },
    { name: "Amber Orange", hex: "#f59e0b" },
    { name: "Vibrant Pink", hex: "#ec4899" },
  ];

  const handleExportSettings = () => {
    const exportData = {
      editorSettings,
      compilerSettings,
      notificationSettings,
      theme,
      accentColor,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "peaklyy-forge-settings.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Local settings exported to JSON file.", "success");
  };

  const handleClearDataClick = () => {
    setConfirmModalState({
      isOpen: true,
      title: "Clear Local Data?",
      message: "This will remove locally stored editor preferences, local drafts, and cache.",
      onConfirm: () => {
        resetPreferences();
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        showToast("Local storage data cleared.", "info");
      },
    });
  };

  const handleResetPreferencesClick = () => {
    setConfirmModalState({
      isOpen: true,
      title: "Reset preferences?",
      message: "This will restore your editor and application preferences to their defaults.",
      onConfirm: () => {
        resetPreferences();
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="settings-view-container">
      {/* Page Header */}
      <div className="view-page-header">
        <div className="view-header-title-group">
          <div className="view-header-icon-badge">
            <Settings size={20} className="text-red" />
          </div>
          <div>
            <h1 className="view-page-title">Settings</h1>
            <p className="view-page-subtitle">
              Customize your coding environment and application preferences.
            </p>
          </div>
        </div>

        <div className="settings-search-bar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="settings-search-input"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Settings Cards */}
      <div className="settings-grid-layout">

        {/* 1. Appearance Card */}
        {matchesSearch("appearance theme accent color dark light") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <Palette size={16} className="text-red" />
              <h3>Appearance</h3>
            </div>

            <div className="card-setting-item">
              <label className="setting-label">Theme</label>
              <div className="theme-toggle-group">
                <button
                  type="button"
                  className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={14} />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  className={`theme-btn ${theme === "light" ? "active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={14} />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  className="theme-btn"
                  onClick={() => setTheme("dark")}
                >
                  <Tv size={14} />
                  <span>System</span>
                </button>
              </div>
              <small className="setting-desc">
                {theme === "dark" ? "Dark theme is currently active." : "Light theme is currently active."}
              </small>
            </div>

            <div className="card-setting-item mt-16">
              <label className="setting-label">Accent Color</label>
              <div className="accent-color-picker">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    className={`accent-circle ${accentColor === col.hex ? "selected" : ""}`}
                    style={{ backgroundColor: col.hex }}
                    onClick={() => setAccentColor(col.hex)}
                    title={col.name}
                  />
                ))}
              </div>
              <small className="setting-desc">Choose your preferred accent color for the interface.</small>
            </div>
          </div>
        )}

        {/* 2. Editor Settings Card */}
        {matchesSearch("editor font size tab size word wrap line numbers minimap auto save") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <Code2 size={16} className="text-red" />
              <h3>Editor Settings</h3>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Font Size</span>
              </div>
              <div className="number-stepper">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() =>
                    updateEditorSettings({ fontSize: Math.max(10, (editorSettings.fontSize || 14) - 1) })
                  }
                >
                  <Minus size={13} />
                </button>
                <span className="step-val">{editorSettings.fontSize || 14}</span>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() =>
                    updateEditorSettings({ fontSize: Math.min(26, (editorSettings.fontSize || 14) + 1) })
                  }
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Tab Size</span>
              </div>
              <CustomSelect
                value={editorSettings.tabSize || 2}
                options={[
                  { label: "2", value: 2 },
                  { label: "4", value: 4 },
                ]}
                onChange={(val) => updateEditorSettings({ tabSize: Number(val) })}
              />
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Word Wrap</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${editorSettings.wordWrap === "on" ? "on" : "off"}`}
                onClick={() =>
                  updateEditorSettings({ wordWrap: editorSettings.wordWrap === "on" ? "off" : "on" })
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Line Numbers</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${editorSettings.lineNumbers === "on" ? "on" : "off"}`}
                onClick={() =>
                  updateEditorSettings({ lineNumbers: editorSettings.lineNumbers === "on" ? "off" : "on" })
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Auto Save</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${editorSettings.autoSave !== false ? "on" : "off"}`}
                onClick={() =>
                  updateEditorSettings({ autoSave: editorSettings.autoSave === false ? true : false })
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Compiler Settings Card */}
        {matchesSearch("compiler default language execution timeout output limit stdin") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <Code2 size={16} className="text-red" />
              <h3>Compiler Settings</h3>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Default Language</span>
              </div>
              <CustomLanguageSelect
                value={compilerSettings.defaultLanguage || "python"}
                onChange={(langKey) => updateCompilerSettings({ defaultLanguage: langKey })}
              />
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Execution Timeout</span>
              </div>
              <CustomSelect
                value={compilerSettings.executionTimeout || "10 seconds"}
                options={[
                  { label: "5 seconds", value: "5 seconds" },
                  { label: "10 seconds", value: "10 seconds" },
                  { label: "15 seconds", value: "15 seconds" },
                ]}
                onChange={(val) => updateCompilerSettings({ executionTimeout: val })}
              />
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Output Limit</span>
              </div>
              <CustomSelect
                value={compilerSettings.outputLimit || "1 MB"}
                options={[
                  { label: "500 KB", value: "500 KB" },
                  { label: "1 MB", value: "1 MB" },
                  { label: "2 MB", value: "2 MB" },
                ]}
                onChange={(val) => updateCompilerSettings({ outputLimit: val })}
              />
            </div>

            <div className="info-banner-box">
              <Info size={15} className="info-icon" />
              <span>Interactive stdin is enabled for supported languages.</span>
            </div>
          </div>
        )}

        {/* 4. Notifications Card */}
        {matchesSearch("notifications execution system notifications") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <Bell size={16} className="text-red" />
              <h3>Notifications</h3>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Execution Notifications</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${notificationSettings.execution !== false ? "on" : "off"}`}
                onClick={() =>
                  updateNotificationSettings({ execution: notificationSettings.execution === false ? true : false })
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">System Notifications</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${notificationSettings.system !== false ? "on" : "off"}`}
                onClick={() =>
                  updateNotificationSettings({ system: notificationSettings.system === false ? true : false })
                }
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <small className="setting-desc" style={{ marginTop: "12px", display: "block" }}>
              Get notified about your activity and execution status.
            </small>
          </div>
        )}

        {/* 5. Data & Preferences Card */}
        {matchesSearch("data preferences export clear reset preferences") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <RefreshCw size={16} className="text-red" />
              <h3>Data & Preferences</h3>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Export Local Settings</span>
                <small className="setting-desc">Download your current editor and application preferences.</small>
              </div>
              <button
                type="button"
                className="forge-button action-btn-sm"
                onClick={handleExportSettings}
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Clear Local Data</span>
                <small className="setting-desc">Remove locally stored editor preferences and cache.</small>
              </div>
              <button
                type="button"
                className="forge-button action-btn-sm"
                onClick={handleClearDataClick}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>

            <div className="card-setting-row">
              <div className="setting-label-group">
                <span className="setting-label">Reset Preferences</span>
                <small className="setting-desc">Reset all editor and application preferences to default values.</small>
              </div>
              <button
                type="button"
                className="forge-button action-btn-sm danger"
                onClick={handleResetPreferencesClick}
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. About Card */}
        {matchesSearch("about peaklyy forge version open source report issue") && (
          <div className="forge-card settings-card">
            <div className="card-header-bar">
              <Info size={16} className="text-red" />
              <h3>About</h3>
            </div>

            <div className="about-brand-row">
              <div>
                <strong className="about-title">Peaklyy Forge</strong>
                <p className="about-desc">An online coding platform to compile, practice and grow your skills.</p>
              </div>
              <span className="about-version-badge">v1.0.0</span>
            </div>

            <div className="about-links-list">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="about-link-item">
                <span>Open Source</span>
                <ExternalLink size={13} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="about-link-item">
                <span>Report an Issue</span>
                <ExternalLink size={13} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="about-link-item">
                <span>Suggest a Feature</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
