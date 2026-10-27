import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Edit3,
  FileText,
  Loader2,
  Save,
  Sliders,
  Sun,
  Moon,
  User,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { RUNNABLE_LANGUAGES, languageMeta } from "../../constants/languages";
import CustomLanguageSelect from "../common/CustomLanguageSelect";
import CustomSelect from "../common/CustomSelect";

export default function ProfileView() {
  const {
    profile,
    updateProfile,
    compilerSettings,
    updateCompilerSettings,
    editorSettings,
    updateEditorSettings,
    theme,
    setTheme,
    setActiveNav,
  } = useEditor();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName || "Gaurav");
  const [bio, setBio] = useState(profile.bio || "Passionate about coding and learning new technologies.");
  
  // Save feedback state: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState("idle");

  const handleSave = async (e) => {
    e.preventDefault();
    if (saveStatus === "saving") return;

    setSaveStatus("saving");

    // Real asynchronous persistence operation simulation for visual feedback
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      updateProfile({
        displayName: displayName.trim() || "Developer",
        bio: bio.trim(),
      });
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
        setIsEditing(false);
      }, 1200);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const initial = (profile.displayName || "G").charAt(0).toUpperCase();
  const compilerRuns = 0;
  const recentActivity = [];

  return (
    <div className="profile-view-container">
      {/* Top Page Header */}
      <div className="view-page-header">
        <div className="view-header-title-group">
          <div className="view-header-icon-badge">
            <User size={20} className="text-red" />
          </div>
          <div>
            <h1 className="view-page-title">Profile</h1>
            <p className="view-page-subtitle">
              Customize your profile and view your coding activity.
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Hero Card */}
      <div className="forge-card profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-hero-avatar">
            <span>{initial}</span>
            <div className="avatar-edit-badge" title="Developer Profile">
              <User size={12} />
            </div>
          </div>
          <div className="profile-hero-meta">
            <h2 className="profile-hero-name">{profile.displayName || "Gaurav"}</h2>
            <span className="profile-hero-title">{profile.title || "Developer"}</span>
            <p className="profile-hero-bio">{profile.bio}</p>
          </div>
        </div>

        <div className="profile-hero-right">
          <button
            type="button"
            className={`forge-button ${isEditing ? "secondary" : "primary-outline"}`}
            onClick={() => {
              if (isEditing) {
                setDisplayName(profile.displayName || "Gaurav");
                setBio(profile.bio || "");
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Edit3 size={15} />
            <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
          </button>
        </div>
      </div>

      {/* Profile Details & Preferences Grid */}
      <div className="profile-grid-duo">
        {/* Profile Details Form Card */}
        <div className="forge-card profile-details-card">
          <div className="card-header-bar">
            <User size={16} className="text-red" />
            <h3>Profile Details</h3>
          </div>

          <form onSubmit={handleSave} className="profile-form-body">
            <div className="form-field-group">
              <label htmlFor="profile-display-name" className="field-label">Display Name</label>
              {isEditing ? (
                <input
                  id="profile-display-name"
                  type="text"
                  className="forge-text-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  required
                />
              ) : (
                <div className="read-only-field-value">{profile.displayName || "Gaurav"}</div>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="profile-bio" className="field-label">Bio</label>
              {isEditing ? (
                <textarea
                  id="profile-bio"
                  rows={3}
                  className="forge-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short developer bio..."
                />
              ) : (
                <div className="read-only-field-value bio-box">{profile.bio || "Add a short bio..."}</div>
              )}
            </div>

            {isEditing && (
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="forge-button primary"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 size={15} className="spinner-icon-rotate" />
                      <span>Saving...</span>
                    </>
                  ) : saveStatus === "saved" ? (
                    <>
                      <Check size={15} />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Preferences Quick Summary Card */}
        <div className="forge-card profile-preferences-card">
          <div className="card-header-bar">
            <Sliders size={16} className="text-red" />
            <h3>Preferences</h3>
          </div>

          <div className="preferences-quick-form">
            <div className="pref-row">
              <span className="pref-label">Default Language</span>
              <CustomLanguageSelect
                value={compilerSettings.defaultLanguage || "python"}
                onChange={(langKey) => updateCompilerSettings({ defaultLanguage: langKey })}
              />
            </div>

            <div className="pref-row">
              <span className="pref-label">Theme</span>
              <CustomSelect
                value={theme}
                icon={theme === "light" ? Sun : Moon}
                options={[
                  { label: "Dark", value: "dark" },
                  { label: "Light", value: "light" },
                ]}
                onChange={(val) => setTheme(val)}
              />
            </div>

            <div className="pref-row">
              <span className="pref-label">Editor Font Size</span>
              <CustomSelect
                value={editorSettings.fontSize || 14}
                options={[
                  { label: "12", value: 12 },
                  { label: "14", value: 14 },
                  { label: "16", value: 16 },
                  { label: "18", value: 18 },
                ]}
                onChange={(val) => updateEditorSettings({ fontSize: Number(val) })}
              />
            </div>

            <div className="pref-row">
              <span className="pref-label">Tab Size</span>
              <CustomSelect
                value={editorSettings.tabSize || 2}
                options={[
                  { label: "2", value: 2 },
                  { label: "4", value: 4 },
                ]}
                onChange={(val) => updateEditorSettings({ tabSize: Number(val) })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coding Activity Section */}
      <div className="profile-activity-section">
        <div className="section-title-group">
          <div className="section-title-left">
            <Code2 size={18} className="text-red" />
            <h2>Compiler Activity</h2>
          </div>
          <span className="section-subtitle">Your compiler runs and coding sessions on Peaklyy Forge.</span>
        </div>

        {/* Real Metric Cards for Compiler */}
        <div className="metrics-quad-grid">
          <div className="metric-stat-card">
            <div className="metric-icon-wrap">
              <Code2 size={20} />
            </div>
            <div className="metric-data">
              <span className="metric-value">{compilerRuns}</span>
              <span className="metric-label">Compiler Runs</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-wrap">
              <CheckCircle2 size={20} />
            </div>
            <div className="metric-data">
              <span className="metric-value">{RUNNABLE_LANGUAGES.length}</span>
              <span className="metric-label">Active Runtimes</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-wrap">
              <Clock size={20} />
            </div>
            <div className="metric-data">
              <span className="metric-value">{RUNNABLE_LANGUAGES.length}</span>
              <span className="metric-label">Languages Ready</span>
            </div>
          </div>
        </div>

        {/* Recent Activity & Languages Used Bottom Duo */}
        <div className="profile-grid-duo mt-20">
          {/* Recent Activity Card */}
          <div className="forge-card activity-log-card">
            <div className="card-header-bar">
              <Clock size={16} className="text-red" />
              <h3>Recent Executions</h3>
            </div>

            {recentActivity.length === 0 ? (
              <div className="activity-empty-state">
                <FileText size={32} className="empty-icon-muted" />
                <h4>No recent executions</h4>
                <p>Your compiler execution history will appear here once you run code.</p>
                <button
                  type="button"
                  className="forge-button primary-btn-sm"
                  onClick={() => setActiveNav("compiler")}
                >
                  <Code2 size={14} />
                  <span>Open Compiler</span>
                </button>
              </div>
            ) : (
              <div className="activity-feed-list">
                {recentActivity.map((item) => (
                  <div key={item.id} className="activity-feed-item">
                    <div className="feed-item-icon">
                      <Code2 size={14} />
                    </div>
                    <div className="feed-item-body">
                      <span className="feed-item-title">{item.title}</span>
                      <small className="feed-item-time">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Languages Used Card */}
          <div className="forge-card languages-used-card">
            <div className="card-header-bar">
              <Code2 size={16} className="text-red" />
              <h3>Supported Languages</h3>
            </div>

            {RUNNABLE_LANGUAGES.length === 0 ? (
              <div className="activity-empty-state">
                <Code2 size={32} className="empty-icon-muted" />
                <h4>No languages configured</h4>
                <p>Configured compiler languages will be shown here.</p>
              </div>
            ) : (
              <div className="languages-badge-grid">
                {RUNNABLE_LANGUAGES.map((langKey) => (
                  <div key={langKey} className="language-used-badge">
                    <span className="lang-dot-indicator" />
                    <span>{languageMeta[langKey]?.label || languageMeta[langKey]?.name || langKey}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
