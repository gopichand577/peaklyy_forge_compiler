/**
 * Peaklyy Forge - C Compilation & Execution Runner (P0)
 */

const path = require("path");
const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Compiles and executes C source code with strict resource controls.
 * @param {string} code - C source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeC(code, input = "") {
  const config = LANGUAGE_CONFIG.c;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "C compiler (gcc/clang) is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace("main.c", code);
  const exePath = path.join(workspace.runDir, "main.exe");
  const env = detection.binDir ? { PATH: `${detection.binDir}${path.delimiter}${process.env.PATH || ""}` } : {};

  try {
    // 1. Compilation Phase
    const compileResult = await runProcess(
      detection.command,
      ["main.c", "-o", "main.exe"],
      {
        cwd: workspace.runDir,
        env,
        timeout: 7000,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (compileResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: "Compilation timed out (7s limit exceeded).",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (compileResult.exitCode !== 0) {
      const err = sanitizeOutput(
        compileResult.stderr || compileResult.stdout || "Compilation failed",
        workspace.runDir,
        "main.c"
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.c"),
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.c"),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(runResult.stdout, workspace.runDir, "main.c");
    const sanitizedStderr = sanitizeOutput(runResult.stderr, workspace.runDir, "main.c");

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
  executeC,
};
