/**
 * Peaklyy Forge - Temporary File & Directory Manager
 * 
 * Provides isolated unique temporary workspaces for each execution run.
 * Handles multi-file creation, safe path traversal checks, and guaranteed cleanup.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE_TEMP_DIR = path.join(__dirname, "..", "temp", "runs");

// Ensure base temp directory exists
try {
  fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
} catch {}

/**
 * Sweeps and cleans stale execution directories older than 30 seconds.
 */
function sweepStaleWorkspaces() {
  try {
    if (!fs.existsSync(BASE_TEMP_DIR)) return;
    const entries = fs.readdirSync(BASE_TEMP_DIR);
    const now = Date.now();

    for (const entry of entries) {
      const fullPath = path.join(BASE_TEMP_DIR, entry);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > 30000) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      } catch {}
    }
  } catch {}
}

// Initial sweep on module load and periodic background sweep (every 15s)
sweepStaleWorkspaces();
const staleSweepTimer = setInterval(sweepStaleWorkspaces, 15000);
if (staleSweepTimer.unref) staleSweepTimer.unref();

/**
 * Safely resolves a sub-path within runDir, preventing path traversal attacks.
 * @param {string} runDir
 * @param {string} relativeFileName
 * @returns {string|null} Safe absolute path or null if invalid/unsafe
 */
function safeResolveFilePath(runDir, relativeFileName) {
  if (!relativeFileName || typeof relativeFileName !== "string") return null;

  // Sanitize relative path
  const sanitized = relativeFileName.replace(/^[/\\]+/, "").trim();
  if (!sanitized || sanitized.includes("..")) return null;

  const resolved = path.normalize(path.join(runDir, sanitized));
  const normRunDir = path.normalize(runDir);

  if (!resolved.startsWith(normRunDir)) {
    return null; // Path traversal attempt detected!
  }
  return resolved;
}

/**
 * Creates an isolated execution directory with the specified source file and optional multi-file attachments.
 * @param {string} fileName - e.g. "Main.java", "main.py", "script.js"
 * @param {string} code - Main source code to write
 * @param {Array<{ name: string, content: string }>|object} [additionalFiles=[]] - Multi-file project assets
 * @returns {{ runDir: string, filePath: string, runId: string }}
 */
function createExecutionWorkspace(fileName, code, additionalFiles = []) {
  const runId = crypto.randomUUID();
  const runDir = path.join(BASE_TEMP_DIR, runId);

  fs.mkdirSync(runDir, { recursive: true });

  const mainPath = safeResolveFilePath(runDir, fileName) || path.join(runDir, "main.py");
  fs.writeFileSync(mainPath, code || "", "utf8");

  // Write additional project files if provided
  let filesList = [];
  if (Array.isArray(additionalFiles)) {
    filesList = additionalFiles;
  } else if (additionalFiles && typeof additionalFiles === "object") {
    filesList = Object.entries(additionalFiles).map(([name, content]) => ({ name, content }));
  }

  for (const fileItem of filesList) {
    if (!fileItem || !fileItem.name || fileItem.name === fileName) continue;
    const targetPath = safeResolveFilePath(runDir, fileItem.name);
    if (targetPath) {
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, fileItem.content || "", "utf8");
    }
  }

  return {
    runId,
    runDir,
    filePath: mainPath,
  };
}

/**
 * Recursively and safely cleans up an execution directory.
 * @param {string} runDir - The directory to remove
 */
function cleanupWorkspace(runDir) {
  if (!runDir || !fs.existsSync(runDir)) return;

  const tryRemove = () => {
    try {
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true, force: true });
      }
    } catch {
      setTimeout(() => {
        try {
          if (fs.existsSync(runDir)) {
            fs.rmSync(runDir, { recursive: true, force: true });
          }
        } catch {}
      }, 200);
    }
  };

  tryRemove();
}

module.exports = {
  BASE_TEMP_DIR,
  createExecutionWorkspace,
  cleanupWorkspace,
  sweepStaleWorkspaces,
  safeResolveFilePath,
};
