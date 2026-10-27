import { Bell, ChevronDown, Code2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "../../context/EditorContext";
import NotificationPanel from "../common/NotificationPanel";
import ProfileMenu from "../common/ProfileMenu";

export default function Navbar() {
  const { activeNav, setActiveNav, profile, unreadCount } = useEditor();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navUserSectionRef = useRef(null);

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setIsNotificationOpen((prev) => !prev);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = (e) => {
    e.stopPropagation();
    setIsProfileMenuOpen((prev) => !prev);
    setIsNotificationOpen(false);
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navUserSectionRef.current && !navUserSectionRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsNotificationOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close popovers on navigation change
  useEffect(() => {
    setIsNotificationOpen(false);
    setIsProfileMenuOpen(false);
  }, [activeNav]);

  const initial = (profile.displayName || "G").charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <nav className="nav-center-switcher" aria-label="Main Navigation">
        <button
          type="button"
          className="nav-tab-btn active"
          onClick={() => setActiveNav("compiler")}
        >
          <Code2 size={16} />
          <span>Compiler</span>
        </button>
      </nav>

      <div className="nav-user-section" ref={navUserSectionRef}>
        <button
          type="button"
          className={`icon-button notification-btn ${isNotificationOpen ? "active" : ""}`}
          onClick={toggleNotifications}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-dot" />}
        </button>

        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />

        <div
          className={`user-profile-lockup ${isProfileMenuOpen ? "active" : ""}`}
          onClick={toggleProfileMenu}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleProfileMenu(e);
            }
          }}
          aria-label="Profile Menu"
        >
          <div className="user-avatar">{initial}</div>
          <div className="user-greeting">
            <small>Good Morning,</small>
            <strong>{profile.displayName || "Gaurav"}</strong>
          </div>
          <ChevronDown
            size={14}
            className={`user-chevron ${isProfileMenuOpen ? "rotated" : ""}`}
          />
        </div>

        <ProfileMenu
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
        />
      </div>
    </header>
  );
}
