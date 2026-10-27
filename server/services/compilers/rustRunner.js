/**
 * Peaklyy Forge - Rust Compilation & Execution Runner (P0)
 */

const path = require("path");
const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Compiles and executes Rust source code with strict resource controls.
 * @param {string} code - Rust source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeRust(code, input = "") {
  const config = LANGUAGE_CONFIG.rust;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Rust compiler (rustc) is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace("main.rs", code);
  const exePath = path.join(workspace.runDir, "main.exe");
  
  // Ensure linker directory is in PATH for rustc
  const searchPaths = [];
  if (detection.linkerBinDir) searchPaths.push(detection.linkerBinDir);
  if (detection.binDir) searchPaths.push(detection.binDir);
  searchPaths.push(process.env.PATH || "");
  const env = { PATH: searchPaths.join(path.delimiter) };

  try {
    // 1. Compilation Phase
    const compileResult = await runProcess(
      detection.command,
      ["main.rs", "-o", "main.exe"],
      {
        cwd: workspace.runDir,
        env,
        timeout: 10000,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (compileResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: "Compilation timed out (10s limit exceeded).",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (compileResult.exitCode !== 0) {
      const err = sanitizeOutput(
        compileResult.stderr || compileResult.stdout || "Compilation failed",
        workspace.runDir,
        "main.rs"
      );
      return {
        status: "COMPILATION_ERROR",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: err,
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: compileResult.exitCode || 1,
      };
    }

    // 2. Execution Phase
    const runResult = await runProcess(
      exePath,
      [],
      {
        cwd: workspace.runDir,
        env,
        input,
        timeout: config.timeout,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (runResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "TIME_LIMIT_EXCEEDED",
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.rs"),
        error: `Time Limit Exceeded (Execution exceeded ${config.timeout / 1000}s limit).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (runResult.outputLimitExceeded) {
      return {
        status: "OUTPUT_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "OUTPUT_LIMIT_EXCEEDED",
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.rs"),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(runResult.stdout, workspace.runDir, "main.rs");
    const sanitizedStderr = sanitizeOutput(runResult.stderr, workspace.runDir, "main.rs");

    if (runResult.exitCode !== 0) {
      return {
        status: "RUNTIME_ERROR",
        compilationStatus: "SUCCESS",
        executionStatus: "RUNTIME_ERROR",
        output: sanitizedStdout,
        error: sanitizedStderr || `Process exited with code ${runResult.exitCode}`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: runResult.exitCode,
      };
    }

    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: sanitizedStdout,
      error: sanitizedStderr || null,
      executionTime: runResult.executionTime,
      memoryUsage: null,
      exitCode: 0,
    };
  } finally {
    cleanupWorkspace(workspace.runDir);
  }
}

module.exports = {
  executeRust,
};
