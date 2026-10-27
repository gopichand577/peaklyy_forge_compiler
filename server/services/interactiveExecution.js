/**
 * Peaklyy Forge - Interactive Execution Engine (P0)
 * 
 * Provides real-time streaming execution, program input prompt interception,
 * and bidirectional stdin communication over WebSocket.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { LANGUAGE_CONFIG } = require("../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../utils/tempManager");
const { killProcessTree } = require("../utils/processRunner");
const { sanitizeOutput } = require("../utils/sanitizer");

const PYTHON_BOOTSTRAP_CODE = `
import sys, builtins

_orig_input = builtins.input
def _forge_input(prompt=""):
    p_str = str(prompt) if prompt is not None else ""
    sys.stdout.flush()
    sys.stderr.write(f"\\x00__FORGE_PROMPT__{p_str}\\x00")
    sys.stderr.flush()
    return _orig_input("")
builtins.input = _forge_input

if __name__ == "__main__":
    with open("main.py", "rb") as f:
        code = f.read()
    compiled = compile(code, "main.py", "exec")
    exec(compiled, {"__name__": "__main__", "__file__": "main.py", "__builtins__": builtins})
`;

/**
 * Starts an interactive execution session.
 * @param {object} params
 * @param {string} params.language
 * @param {string} params.code
 * @param {Array<{ name: string, content: string }>} [params.files=[]]
 * @param {string} [params.initialInput=""]
 * @param {function} params.onPrompt - Called with prompt string when program calls input()
 * @param {function} params.onStdout - Called with stdout chunk
 * @param {function} params.onStderr - Called with stderr chunk
 * @param {function} params.onComplete - Called with final execution result
 * @returns {{ writeStdin: function, kill: function }}
 */
function startInteractiveSession({
  language,
  code,
  files = [],
  initialInput = "",
  interactive = false,
  closeStdin = false,
  onPrompt = () => {},
  onStdout = () => {},
  onStderr = () => {},
  onComplete: rawOnComplete = () => {},
}) {
  const normalizedLang = (language || "").toLowerCase().trim();
  const config = LANGUAGE_CONFIG[normalizedLang];

  const onComplete = (result) => {
    rawOnComplete(result);
  };

  if (!config) {
    onComplete({
      status: "SYSTEM_ERROR",
      output: "",
      error: `Unsupported language: '${language}'`,
      executionTime: 0,
      exitCode: 1,
    });
    return { writeStdin: () => {}, endStdin: () => {}, kill: () => {} };
  }

  // Handle preview languages
  if (config.executionMode === "preview") {
    onComplete({
      status: "SUCCESS",
      output: `${config.name} rendered in live preview.`,
      error: null,
      executionTime: 0,
      exitCode: 0,
    });
    return { writeStdin: () => {}, endStdin: () => {}, kill: () => {} };
  }

  const detection = config.detect ? config.detect() : { available: false };
  if (!detection.available) {
    onComplete({
      status: "SYSTEM_ERROR",
      output: "",
      error: `${config.name} is not installed or configured on the server environment.`,
      executionTime: 0,
      exitCode: 1,
    });
    return { writeStdin: () => {}, endStdin: () => {}, kill: () => {} };
  }

  const workspace = createExecutionWorkspace(config.defaultFileName, code, files);
  let child = null;
  let activeCompileProcess = null;
  let isSettled = false;
  let totalOutputBytes = 0;
  let accumulatedStdout = "";
  let accumulatedStderr = "";
  const startTime = process.hrtime.bigint();

  let timeoutTimer = null;
  const resetTimeout = () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(() => {
      if (isSettled) return;
      if (activeCompileProcess) killProcessTree(activeCompileProcess.pid);
      if (child) killProcessTree(child.pid);
      isSettled = true;
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;
      cleanupWorkspace(workspace.runDir);
      onComplete({
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "TIME_LIMIT_EXCEEDED",
        output: sanitizeOutput(accumulatedStdout, workspace.runDir, config.defaultFileName),
        error: `Time Limit Exceeded (Execution exceeded ${config.timeout / 1000}s limit).`,
        executionTime: Math.round(executionTime * 1000) / 1000,
        exitCode: null,
      });
    }, config.timeout || 10000);
  };

  resetTimeout();

  const writeStdin = (data) => {
    if (child && child.stdin && !child.stdin.destroyed && !isSettled) {
      resetTimeout();
      try {
        child.stdin.write(data);
      } catch (e) {}
    }
  };

  const endStdin = () => {
    if (child && child.stdin && !child.stdin.destroyed && !isSettled) {
      try {
        child.stdin.end();
      } catch (e) {}
    }
  };

  const kill = () => {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    isSettled = true;
    if (activeCompileProcess) killProcessTree(activeCompileProcess.pid);
    if (child) killProcessTree(child.pid);
    cleanupWorkspace(workspace.runDir);
  };

  const extraBin = detection.binDir || (detection.linkerBinDir ? detection.linkerBinDir : null);
  const safeEnv = {
    PATH: extraBin ? `${extraBin}${path.delimiter}${process.env.PATH || ""}` : process.env.PATH,
    PATHEXT: process.env.PATHEXT,
    SYSTEMROOT: process.env.SYSTEMROOT,
    WINDIR: process.env.WINDIR,
    TMP: process.env.TMP,
    TEMP: process.env.TEMP,
    JAVA_HOME: process.env.JAVA_HOME,
    NODE_PATH: process.env.NODE_PATH,
    PYTHONPATH: "",
    PYTHONIOENCODING: "utf-8",
  };

  if (normalizedLang === "python") {
    // Write bootstrap file for Python
    fs.writeFileSync(path.join(workspace.runDir, "_bootstrap.py"), PYTHON_BOOTSTRAP_CODE, "utf8");

    child = spawn(detection.command, ["-u", "-X", "utf8", "_bootstrap.py"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "javascript") {
    child = spawn(detection.command, ["--max-old-space-size=128", config.defaultFileName], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "typescript") {
    child = spawn(detection.command, ["--experimental-strip-types", "--max-old-space-size=128", config.defaultFileName], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "java") {
    // For Java, first compile then run
    const publicClassMatch = code.match(/public\s+class\s+([A-Za-z0-9_$]+)/);
    const className = publicClassMatch ? publicClassMatch[1] : "Main";
    const javaSourceFile = `${className}.java`;
    fs.writeFileSync(path.join(workspace.runDir, javaSourceFile), code, "utf8");

    const compileProcess = spawn(detection.javac, ["-encoding", "UTF-8", javaSourceFile], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
    });
    activeCompileProcess = compileProcess;

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, javaSourceFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      child = spawn(detection.java, ["-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8", "-Xmx128m", "-cp", ".", className], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });
    return { writeStdin, endStdin, kill };
  } else if (normalizedLang === "csharp") {
    const csFile = "Program.cs";
    fs.writeFileSync(path.join(workspace.runDir, csFile), code, "utf8");
    const exeFile = path.join(workspace.runDir, "app.exe");

    const compileProcess = spawn(detection.command, ["/nologo", "/target:exe", `/out:${exeFile}`, csFile], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
    });
    activeCompileProcess = compileProcess;

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.stdout.on("data", (c) => (compileErr += c.toString()));

    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, csFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      child = spawn(exeFile, [], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });

    return { writeStdin, endStdin, kill };
  } else if (normalizedLang === "c") {
    const cFile = "main.c";
    fs.writeFileSync(path.join(workspace.runDir, cFile), code, "utf8");
    const exeFile = path.join(workspace.runDir, "main.exe");
    const compileCmd = detection.command || "gcc";

    const compileProcess = spawn(compileCmd, ["main.c", "-o", "main.exe"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
    });

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.stdout.on("data", (c) => (compileErr += c.toString()));

    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, cFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      child = spawn(exeFile, [], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });

    return { writeStdin, endStdin, kill };
  } else if (normalizedLang === "cpp") {
    const cppFile = "main.cpp";
    fs.writeFileSync(path.join(workspace.runDir, cppFile), code, "utf8");
    const exeFile = path.join(workspace.runDir, "main.exe");
    const compileCmd = detection.command || "g++";

    const compileProcess = spawn(compileCmd, ["main.cpp", "-o", "main.exe"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
    });

    activeCompileProcess = compileProcess;

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.stdout.on("data", (c) => (compileErr += c.toString()));

    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, cppFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      child = spawn(exeFile, [], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });

    return { writeStdin, endStdin, kill };
  } else if (normalizedLang === "go") {
    const os = require("os");
    const sharedGoCache = path.join(os.tmpdir(), "peaklyy-go-cache");
    const goEnv = {
      ...safeEnv,
      GOCACHE: sharedGoCache,
      GOTMPDIR: workspace.runDir,
    };
    child = spawn(detection.command, ["run", "main.go"], {
      cwd: workspace.runDir,
      env: goEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "rust") {
    const rustFile = "main.rs";
    fs.writeFileSync(path.join(workspace.runDir, rustFile), code, "utf8");
    const exeFile = path.join(workspace.runDir, "main.exe");
    const rustArgs = ["main.rs", "-o", "main.exe"];
    if (detection.linkerBinDir) {
      rustArgs.push("-C", `linker=${path.join(detection.linkerBinDir, "x86_64-w64-mingw32-clang.exe")}`);
    }

    const compileProcess = spawn(detection.command, rustArgs, {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
    });

    activeCompileProcess = compileProcess;

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.stdout.on("data", (c) => (compileErr += c.toString()));

    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, rustFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      child = spawn(exeFile, [], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });

    return { writeStdin, endStdin, kill };
  } else if (normalizedLang === "php") {
    child = spawn(detection.command, ["main.php"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "ruby") {
    child = spawn(detection.command, ["main.rb"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "dart") {
    child = spawn(detection.command, ["run", "main.dart"], {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else if (normalizedLang === "kotlin") {
    const ktFile = "Main.kt";
    fs.writeFileSync(path.join(workspace.runDir, ktFile), code, "utf8");
    const jarFile = "app.jar";

    const isWindows = process.platform === "win32";
    const compileCmd = isWindows ? (process.env.COMSPEC || "cmd.exe") : detection.command;
    const compileArgs = isWindows ? ["/c", `"${detection.command}"`, ktFile, "-include-runtime", "-d", jarFile] : [ktFile, "-include-runtime", "-d", jarFile];

    const compileProcess = spawn(compileCmd, compileArgs, {
      cwd: workspace.runDir,
      env: safeEnv,
      windowsHide: true,
      windowsVerbatimArguments: isWindows,
    });

    activeCompileProcess = compileProcess;

    let compileErr = "";
    compileProcess.stderr.on("data", (c) => (compileErr += c.toString()));
    compileProcess.stdout.on("data", (c) => (compileErr += c.toString()));

    compileProcess.on("close", (cCode) => {
      activeCompileProcess = null;
      if (cCode !== 0) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "COMPILATION_ERROR",
          compilationStatus: "COMPILATION_ERROR",
          executionStatus: null,
          output: "",
          error: sanitizeOutput(compileErr, workspace.runDir, ktFile),
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: cCode,
        });
      }

      resetTimeout();
      const javaCmd = (LANGUAGE_CONFIG.java && LANGUAGE_CONFIG.java.detect && LANGUAGE_CONFIG.java.detect().java) || "java";
      child = spawn(javaCmd, ["-jar", jarFile], {
        cwd: workspace.runDir,
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachChildHandlers();
    });

    return { writeStdin, endStdin, kill };
  } else {
    isSettled = true;
    clearTimeout(timeoutTimer);
    cleanupWorkspace(workspace.runDir);
    onComplete({
      status: "SYSTEM_ERROR",
      output: "",
      error: `No interactive execution runner configured for language '${language}'.`,
      executionTime: 0,
      exitCode: 1,
    });
    return { writeStdin: () => {}, kill: () => {} };
  }

  function attachChildHandlers() {
    if (!child) return;

    if (child.stdin) {
      child.stdin.on("error", () => {});
      try {
        if (initialInput && initialInput.length > 0) {
          const normalized = initialInput.endsWith("\n") ? initialInput : `${initialInput}\n`;
          if (!interactive || closeStdin) {
            child.stdin.end(normalized, "utf8");
          } else {
            child.stdin.write(normalized, "utf8");
          }
        } else if (!interactive || closeStdin) {
          child.stdin.end();
        }
      } catch (e) {}
    }

    child.stdout.on("data", (chunk) => {
      resetTimeout();
      const text = chunk.toString("utf8");
      totalOutputBytes += chunk.length;
      accumulatedStdout += text;

      if (totalOutputBytes > (config.maxOutputSize || 262144)) {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeoutTimer);
        killProcessTree(child.pid);
        cleanupWorkspace(workspace.runDir);
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        return onComplete({
          status: "OUTPUT_LIMIT_EXCEEDED",
          compilationStatus: "SUCCESS",
          executionStatus: "OUTPUT_LIMIT_EXCEEDED",
          output: sanitizeOutput(accumulatedStdout, workspace.runDir, config.defaultFileName),
          error: "Output Limit Exceeded.",
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode: null,
        });
      }

      const sanitizedChunk = sanitizeOutput(text, workspace.runDir, config.defaultFileName, true);
      onStdout(sanitizedChunk);
    });

    let stderrBuffer = "";
    child.stderr.on("data", (chunk) => {
      resetTimeout();
      const text = chunk.toString("utf8");
      stderrBuffer += text;

      // Check for intercepted prompt tokens: \x00__FORGE_PROMPT__{prompt}\x00
      let promptMatch;
      while ((promptMatch = stderrBuffer.match(/\x00__FORGE_PROMPT__(.*?)\x00/))) {
        const promptText = promptMatch[1];
        const tokenLength = promptMatch[0].length;
        const matchIndex = promptMatch.index;

        // Any stderr before the token
        const before = stderrBuffer.substring(0, matchIndex);
        if (before) {
          accumulatedStderr += before;
          onStderr(sanitizeOutput(before, workspace.runDir, config.defaultFileName));
        }

        stderrBuffer = stderrBuffer.substring(matchIndex + tokenLength);
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        onPrompt(promptText);
      }

      if (stderrBuffer && !stderrBuffer.includes("\x00")) {
        accumulatedStderr += stderrBuffer;
        onStderr(sanitizeOutput(stderrBuffer, workspace.runDir, config.defaultFileName));
        stderrBuffer = "";
      }
    });

    child.on("error", (err) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutTimer);
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;
      cleanupWorkspace(workspace.runDir);
      onComplete({
        status: "SYSTEM_ERROR",
        output: sanitizeOutput(accumulatedStdout, workspace.runDir, config.defaultFileName),
        error: err.message,
        executionTime: Math.round(executionTime * 1000) / 1000,
        exitCode: 1,
      });
    });

    child.on("close", (exitCode) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutTimer);

      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;

      const sanitizedStdout = sanitizeOutput(accumulatedStdout, workspace.runDir, config.defaultFileName);
      const sanitizedStderr = sanitizeOutput(accumulatedStderr, workspace.runDir, config.defaultFileName);

      cleanupWorkspace(workspace.runDir);

      if (exitCode !== 0) {
        const isSyntaxError = /SyntaxError|IndentationError|TabError/.test(sanitizedStderr);
        return onComplete({
          status: isSyntaxError ? "COMPILATION_ERROR" : "RUNTIME_ERROR",
          compilationStatus: isSyntaxError ? "COMPILATION_ERROR" : "SUCCESS",
          executionStatus: isSyntaxError ? null : "RUNTIME_ERROR",
          output: sanitizedStdout,
          error: sanitizedStderr || "Program terminated with an error.",
          executionTime: Math.round(executionTime * 1000) / 1000,
          exitCode,
        });
      }

      onComplete({
        status: "SUCCESS",
        compilationStatus: "SUCCESS",
        executionStatus: "SUCCESS",
        output: sanitizedStdout || (sanitizedStderr ? sanitizedStderr : "Program executed successfully with no output."),
        error: null,
        executionTime: Math.round(executionTime * 1000) / 1000,
        exitCode: 0,
      });
    });
  }

  attachChildHandlers();

  return { writeStdin, endStdin, kill };
}

module.exports = {
  startInteractiveSession,
};
