/**
 * Peaklyy Forge - Go Execution Runner (P0)
 */

const path = require("path");
const os = require("os");
const fs = require("fs");
const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

const SHARED_GO_CACHE = path.join(os.tmpdir(), "peaklyy-go-cache");
try { fs.mkdirSync(SHARED_GO_CACHE, { recursive: true }); } catch {}

/**
 * Compiles and executes Go source code with strict resource controls.
 * @param {string} code - Go source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeGo(code, input = "") {
  const config = LANGUAGE_CONFIG.go;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Go compiler (go) is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace("main.go", code);
  const env = {
    GOCACHE: SHARED_GO_CACHE,
    GOTMPDIR: workspace.runDir,
    ...(detection.binDir ? { PATH: `${detection.binDir}${path.delimiter}${process.env.PATH || ""}` } : {}),
  };

  try {
    const runResult = await runProcess(
      detection.command,
      ["run", "main.go"],
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.go"),
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.go"),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(runResult.stdout, workspace.runDir, "main.go");
    const sanitizedStderr = sanitizeOutput(runResult.stderr, workspace.runDir, "main.go");

    if (runResult.exitCode !== 0) {
      // Differentiate compilation error vs runtime panic
      const isCompileError = sanitizedStderr.includes("syntax error") ||
                             sanitizedStderr.includes("undefined:") ||
                             sanitizedStderr.includes("cannot use") ||
                             sanitizedStderr.includes("imported and not used");
      return {
        status: isCompileError ? "COMPILATION_ERROR" : "RUNTIME_ERROR",
        compilationStatus: isCompileError ? "COMPILATION_ERROR" : "SUCCESS",
        executionStatus: isCompileError ? null : "RUNTIME_ERROR",
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
  executeGo,
};
