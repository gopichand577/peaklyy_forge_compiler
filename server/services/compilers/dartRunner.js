/**
 * Peaklyy Forge - Dart Execution Runner (P0)
 */

const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Executes Dart source code with strict resource controls.
 * @param {string} code - Dart source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeDart(code, input = "") {
  const config = LANGUAGE_CONFIG.dart;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Dart SDK (dart) is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace("main.dart", code);

  try {
    const runResult = await runProcess(
      detection.command,
      ["run", "main.dart"],
      {
        cwd: workspace.runDir,
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.dart"),
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "main.dart"),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(runResult.stdout, workspace.runDir, "main.dart");
    const sanitizedStderr = sanitizeOutput(runResult.stderr, workspace.runDir, "main.dart");

    if (runResult.exitCode !== 0) {
      const isCompileError = (sanitizedStderr || sanitizedStdout).includes("Error:") ||
                             (sanitizedStderr || sanitizedStdout).includes("SyntaxError");
      return {
        status: isCompileError ? "COMPILATION_ERROR" : "RUNTIME_ERROR",
        compilationStatus: isCompileError ? "COMPILATION_ERROR" : "SUCCESS",
        executionStatus: isCompileError ? null : "RUNTIME_ERROR",
        output: sanitizedStdout,
        error: sanitizedStderr || sanitizedStdout || `Process exited with code ${runResult.exitCode}`,
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
  executeDart,
};
