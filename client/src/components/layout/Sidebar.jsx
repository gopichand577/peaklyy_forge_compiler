import {
  Code2,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import logo from "../../assets/logos/peaklyy-logo.png";
import { useEditor } from "../../context/EditorContext";

export default function Sidebar() {
  const { activeNav, setActiveNav } = useEditor();

  return (
    <aside className="sidebar" aria-label="Sidebar Navigation">
      <div>
        <a href="#" className="brand" onClick={(e) => e.preventDefault()}>
          <div className="brand-logo-wrap">
            <img src={logo} alt="Peaklyy Logo" className="brand-logo-img" />
          </div>
          <div className="brand-copy">
            <span>
              <strong>Peaklyy</strong> <em>Forge</em>
            </span>
            <small>CODE | COMPILER | IDE</small>
          </div>
        </a>

        <nav className="side-nav">
          <div className="nav-label">MAIN</div>

          <button
            type="button"
            className={`nav-item ${activeNav === "compiler" ? "active" : ""}`}
            onClick={() => setActiveNav("compiler")}
          >
            <Code2 size={18} />
            <span>Compiler</span>
          </button>

          <div className="nav-label account-label">ACCOUNT</div>

          <button
            type="button"
            className={`nav-item ${activeNav === "profile" ? "active" : ""}`}
            onClick={() => setActiveNav("profile")}
          >
            <User size={18} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => setActiveNav("settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <button type="button" className="sign-out">
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </aside>
  );
}