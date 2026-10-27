/**
 * Peaklyy Forge - Centralized Language Configuration (P0 Only)
 * 
 * Defines trusted server-side execution configurations, compiler detection,
 * file extensions, and limits for all supported and target programming languages.
 */

const path = require("path");
const fs = require("fs");
const { EXECUTION_LIMITS } = require("./executionLimits");

/**
 * Check if an executable is available in PATH or extra specified directories.
 * @param {string[]} names - Executable names
 * @param {string[]} [extraPaths=[]] - Additional directories to search
 * @returns {string|null} Full path to executable or null
 */
function findExecutable(names, extraPaths = []) {
  const isWindows = process.platform === "win32";
  const pathExt = isWindows ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";") : [""];
  const searchPaths = [
    ...extraPaths,
    ...(process.env.PATH || "").split(path.delimiter),
  ];

  for (const name of names) {
    if (fs.existsSync(name)) {
      return name;
    }
    for (const dir of searchPaths) {
      if (!dir) continue;
      for (const ext of pathExt) {
        const fullPath = path.join(dir, name + ext);
        if (fs.existsSync(fullPath)) {
          try {
            fs.accessSync(fullPath, fs.constants.X_OK || fs.constants.F_OK);
            return fullPath;
          } catch (e) {
            // Ignore access errors and continue search
          }
        }
      }
    }
  }
  return null;
}

// Java compiler / runtime detection helper
function detectJava() {
  const extraPaths = [
    path.join(__dirname, "..", "runtimes", "jdk", "bin"),
    path.join(__dirname, "..", "runtimes", "bin"),
  ];

  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    extraPaths.push(path.join(javaHome, "bin"));
  }

  if (process.platform === "win32") {
    const programFiles = [
      process.env["ProgramFiles"],
      process.env["ProgramFiles(x86)"],
      process.env["LocalAppData"] ? path.join(process.env["LocalAppData"], "Programs") : null,
    ].filter(Boolean);

    for (const pf of programFiles) {
      const javaDir = path.join(pf, "Java");
      if (fs.existsSync(javaDir)) {
        try {
          const entries = fs.readdirSync(javaDir);
          for (const entry of entries) {
            extraPaths.push(path.join(javaDir, entry, "bin"));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  const javacPath = findExecutable(["javac"], extraPaths);
  const javaPath = findExecutable(["java"], extraPaths);

  const binDir = javacPath ? path.dirname(javacPath) : (javaPath ? path.dirname(javaPath) : null);
  const computedJavaHome = binDir ? path.dirname(binDir) : (process.env.JAVA_HOME || null);

  return {
    available: Boolean(javacPath && javaPath),
    javac: javacPath || "javac",
    java: javaPath || "java",
    binDir,
    javaHome: computedJavaHome,
  };
}

// Python interpreter detection helper
function detectPython() {
  const pythonPath = findExecutable(["python3", "python", "py"]);
  return {
    available: Boolean(pythonPath),
    command: pythonPath || "python",
  };
}

// Node.js interpreter detection helper
function detectNode() {
  const nodePath = findExecutable(["node"]);
  return {
    available: Boolean(nodePath),
    command: nodePath || "node",
  };
}

// TypeScript interpreter detection (uses native Node 22+/24+ stripped types or tsx)
function detectTypeScript() {
  const nodeDetect = detectNode();
  if (nodeDetect.available) {
    return {
      available: true,
      command: nodeDetect.command,
      flags: ["--experimental-strip-types"],
    };
  }
  return {
    available: false,
    command: null,
  };
}

// Detection for other target languages
const WINLIBS_BIN = "C:\\Users\\abhij\\AppData\\Local\\Microsoft\\WinGet\\Packages\\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\\mingw64\\bin";
const LLVM_MINGW_BIN = "C:\\Users\\abhij\\AppData\\Local\\Microsoft\\WinGet\\Packages\\MartinStorsjo.LLVM-MinGW.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\\llvm-mingw-20261020-ucrt-x86_64\\bin";

function detectC() {
  const extraPaths = [WINLIBS_BIN, "C:\\Program Files\\LLVM\\bin"];
  const exe = findExecutable(["gcc", "clang", "cl"], extraPaths);
  return { available: Boolean(exe), command: exe, binDir: exe ? path.dirname(exe) : null };
}

function detectCpp() {
  const extraPaths = [WINLIBS_BIN, "C:\\Program Files\\LLVM\\bin"];
  const exe = findExecutable(["g++", "clang++", "cl"], extraPaths);
  return { available: Boolean(exe), command: exe, binDir: exe ? path.dirname(exe) : null };
}

function detectCSharp() {
  const nativeCsc64 = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
  const nativeCsc32 = "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe";
  if (fs.existsSync(nativeCsc64)) return { available: true, command: nativeCsc64 };
  if (fs.existsSync(nativeCsc32)) return { available: true, command: nativeCsc32 };
  const exe = findExecutable(["dotnet", "csc"]);
  return { available: Boolean(exe), command: exe };
}

function detectGo() {
  const extraPaths = [
    "C:\\Program Files\\Go\\bin",
    "C:\\Go\\bin",
    path.join(process.env.USERPROFILE || "", "go", "bin"),
  ];
  const exe = findExecutable(["go"], extraPaths);
  return { available: Boolean(exe), command: exe, binDir: exe ? path.dirname(exe) : null };
}

function detectRust() {
  const extraPaths = [
    "C:\\Program Files\\Rust stable LLVM 1.99\\bin",
    "C:\\Program Files\\Rust\\bin",
    path.join(process.env.USERPROFILE || "", ".cargo", "bin"),
  ];
  const exe = findExecutable(["rustc"], extraPaths);
  return {
    available: Boolean(exe),
    command: exe,
    binDir: exe ? path.dirname(exe) : null,
    linkerBinDir: LLVM_MINGW_BIN,
  };
}

function detectPhp() {
  const extraPaths = [
    "C:\\Users\\abhij\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "C:\\Program Files\\PHP",
    "C:\\tools\\php",
    path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WindowsApps"),
  ];
  const exe = findExecutable(["php"], extraPaths);
  return { available: Boolean(exe), command: exe };
}

function detectKotlin() {
  const extraPaths = [
    path.join(__dirname, "..", "runtimes", "kotlin", "kotlinc", "bin"),
  ];
  const exe = findExecutable(["kotlinc.bat", "kotlinc"], extraPaths);
  return { available: Boolean(exe), command: exe };
}

function detectSwift() {
  // Swift CLI is present but requires MSVC SDK link.exe which is missing on host
  const extraPaths = [
    "C:\\Users\\abhij\\AppData\\Local\\Programs\\Swift\\Toolchains\\6.4.1+Asserts\\usr\\bin",
  ];
  const exe = findExecutable(["swift"], extraPaths);
  // Verify if link.exe is available for MSVC target
  const linkExe = findExecutable(["link"]);
  if (!linkExe) {
    return {
      available: false,
      command: exe,
      blockingReason: "Swift on Windows requires Visual Studio MSVC link.exe toolchain",
    };
  }
  return { available: Boolean(exe), command: exe };
}

function detectRuby() {
  const extraPaths = [
    "C:\\Ruby34-x64\\bin",
    "C:\\Ruby33-x64\\bin",
    "C:\\Ruby32-x64\\bin",
    "C:\\Ruby31-x64\\bin",
    "C:\\Ruby30-x64\\bin",
  ];
  const exe = findExecutable(["ruby"], extraPaths);
  return { available: Boolean(exe), command: exe };
}

function detectDart() {
  const extraPaths = [
    "C:\\Users\\abhij\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Google.DartSDK_Microsoft.Winget.Source_8wekyb3d8bbwe\\dart-sdk\\bin",
    "C:\\tools\\dart-sdk\\bin",
    path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WindowsApps"),
  ];
  const exe = findExecutable(["dart"], extraPaths);
  return { available: Boolean(exe), command: exe };
}

const DEFAULT_LIMITS = {
  TIMEOUT_MS: EXECUTION_LIMITS.cpuTimeMs,
  MAX_OUTPUT_BYTES: EXECUTION_LIMITS.maxOutputBytes,
  MAX_CODE_BYTES: EXECUTION_LIMITS.maxSourceBytes,
  MAX_INPUT_BYTES: EXECUTION_LIMITS.maxInputBytes,
};

const LANGUAGE_CONFIG = {
  python: {
    id: "python",
    name: "Python 3",
    extension: "py",
    defaultFileName: "main.py",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: null,
    detect: detectPython,
  },
  javascript: {
    id: "javascript",
    name: "JavaScript (Node.js)",
    extension: "js",
    defaultFileName: "main.js",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: `${EXECUTION_LIMITS.maxOldSpaceSizeNode}MB`,
    detect: detectNode,
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    extension: "ts",
    defaultFileName: "main.ts",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: `${EXECUTION_LIMITS.maxOldSpaceSizeNode}MB`,
    detect: detectTypeScript,
  },
  java: {
    id: "java",
    name: "Java",
    extension: "java",
    defaultFileName: "Main.java",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: EXECUTION_LIMITS.maxHeapJava,
    detect: detectJava,
  },
  c: {
    id: "c",
    name: "C",
    extension: "c",
    defaultFileName: "main.c",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectC,
  },
  cpp: {
    id: "cpp",
    name: "C++",
    extension: "cpp",
    defaultFileName: "main.cpp",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectCpp,
  },
  csharp: {
    id: "csharp",
    name: "C#",
    extension: "cs",
    defaultFileName: "Program.cs",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectCSharp,
  },
  go: {
    id: "go",
    name: "Go",
    extension: "go",
    defaultFileName: "main.go",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectGo,
  },
  rust: {
    id: "rust",
    name: "Rust",
    extension: "rs",
    defaultFileName: "main.rs",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectRust,
  },
  php: {
    id: "php",
    name: "PHP",
    extension: "php",
    defaultFileName: "main.php",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectPhp,
  },
  kotlin: {
    id: "kotlin",
    name: "Kotlin",
    extension: "kt",
    defaultFileName: "Main.kt",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectKotlin,
  },
  swift: {
    id: "swift",
    name: "Swift",
    extension: "swift",
    defaultFileName: "main.swift",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectSwift,
  },
  ruby: {
    id: "ruby",
    name: "Ruby",
    extension: "rb",
    defaultFileName: "main.rb",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectRuby,
  },
  dart: {
    id: "dart",
    name: "Dart",
    extension: "dart",
    defaultFileName: "main.dart",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    detect: detectDart,
  },
  html: {
    id: "html",
    name: "HTML",
    extension: "html",
    defaultFileName: "index.html",
    executionMode: "preview",
  },
  css: {
    id: "css",
    name: "CSS",
    extension: "css",
    defaultFileName: "style.css",
    executionMode: "preview",
  },
};

/**
 * Returns runtime availability status for all configured languages.
 */
function getLanguageAvailability() {
  const result = {};
  for (const [key, cfg] of Object.entries(LANGUAGE_CONFIG)) {
    if (cfg.executionMode === "preview") {
      result[key] = {
        id: key,
        name: cfg.name,
        extension: cfg.extension,
        defaultFileName: cfg.defaultFileName,
        available: true,
        executionMode: "preview",
      };
    } else {
      const detectResult = cfg.detect ? cfg.detect() : { available: false };
      result[key] = {
        id: key,
        name: cfg.name,
        extension: cfg.extension,
        defaultFileName: cfg.defaultFileName,
        available: Boolean(detectResult.available),
        executionMode: cfg.executionMode,
      };
    }
  }
  return result;
}

module.exports = {
  LANGUAGE_CONFIG,
  DEFAULT_LIMITS,
  EXECUTION_LIMITS,
  findExecutable,
  detectJava,
  detectPython,
  detectNode,
  detectTypeScript,
  getLanguageAvailability,
};
