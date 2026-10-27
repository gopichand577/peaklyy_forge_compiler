import { Check, ChevronDown, Code2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  getFileLanguage,
  languageMeta,
  RUNNABLE_LANGUAGES,
  TARGET_LANGUAGES,
  useEditor,
} from "../../context/EditorContext";
import LanguageIcon from "../common/LanguageIcon";

export default function LanguageSelector() {
  const { project, setLanguage, availableRuntimes, activeFile } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const gridRef = useRef(null);

  const currentLangKey = getFileLanguage(activeFile?.name, project?.language || "python");
  const current = languageMeta[currentLangKey] || { label: currentLangKey };

  // All target languages are fully available and selectable
  const languageItems = TARGET_LANGUAGES.map((key) => {
    const meta = languageMeta[key] || { label: key };
    return {
      key,
      label: meta.label || key,
      isAvailable: true,
      isPreview: Boolean(meta.isPreview),
    };
  });

  // Keep focusedIndex in bounds and on open highlight selected
  useEffect(() => {
    if (isOpen) {
      const selectedIdx = languageItems.findIndex((item) => item.key === currentLangKey);
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    }
  }, [isOpen, currentLangKey]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 2 < languageItems.length ? prev + 2 : prev));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 2 >= 0 ? prev - 2 : prev));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1 < languageItems.length ? prev + 1 : prev));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const target = languageItems[focusedIndex];
        if (target && target.isAvailable) {
          setLanguage(target.key);
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedIndex, languageItems, setLanguage]);

  const handleSelect = (item) => {
    if (!item.isAvailable) {
      return;
    }
    setLanguage(item.key);
    setIsOpen(false);
  };

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-language-trigger ${isOpen ? "open" : ""} ${!project?.language ? "placeholder" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select programming language"
      >
        <span className="lang-icon-badge" style={{ display: "flex", alignItems: "center" }}>
          {project?.language ? (
            <LanguageIcon language={project.language} size={17} />
          ) : (
            <Code2 size={16} className="text-red" />
          )}
        </span>
        <span className="lang-trigger-label" style={{ fontWeight: project?.language ? 600 : 400 }}>
          {current.label}
        </span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? "rotated" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="custom-language-dropdown leetcode-grid-dropdown"
          role="listbox"
          aria-label="Programming Language Selector"
          ref={gridRef}
        >
          <div className="dropdown-grid-header">
            <span className="grid-header-title">PROGRAMMING LANGUAGES</span>
            <span className="grid-header-count">{languageItems.length} languages</span>
          </div>

          <div className="leetcode-language-grid">
            {languageItems.map((item, idx) => {
              const isSelected = currentLangKey === item.key;
              const isFocused = focusedIndex === idx;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`lang-option-card ${isSelected ? "selected" : ""} ${
                    isFocused ? "focused" : ""
                  }`}
                  onClick={() => handleSelect(item)}
                  role="option"
                  aria-selected={isSelected}
                  title={
                    item.isPreview
                      ? `${item.label} (Live Web Preview)`
                      : `Select ${item.label} (${languageMeta[item.key]?.defaultFileName})`
                  }
                >
                  <span className="lang-card-icon">
                    <LanguageIcon language={item.key} size={17} />
                  </span>
                  <span className="lang-card-name">{item.label}</span>

                  {isSelected && (
                    <span className="lang-selected-indicator" aria-label="Selected">
                      <Check size={13} className="lang-check-icon" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
