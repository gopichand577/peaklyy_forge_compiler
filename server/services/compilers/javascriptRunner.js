/**
 * Peaklyy Forge - JavaScript (Node.js) Execution Runner (P0)
 */

const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Executes JavaScript code using isolated Node.js child process.
 * @param {string} code - JavaScript source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeJavaScript(code, input = "") {
  const config = LANGUAGE_CONFIG.javascript;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Node.js runtime is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace(config.defaultFileName, code);

  try {
    const result = await runProcess(
      detection.command,
      ["--max-old-space-size=128", config.defaultFileName],
      {
        cwd: workspace.runDir,
        input,
        timeout: config.timeout,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (result.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "TIME_LIMIT_EXCEEDED",
        output: sanitizeOutput(result.stdout, workspace.runDir, config.defaultFileName),
        error: `Time Limit Exceeded (Execution exceeded ${config.timeout / 1000}s limit).`,
        executionTime: result.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (result.outputLimitExceeded) {
      return {
        status: "OUTPUT_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "OUTPUT_LIMIT_EXCEEDED",
        output: sanitizeOutput(result.stdout, workspace.runDir, config.defaultFileName),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: result.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(result.stdout, workspace.runDir, config.defaultFileName);
    const sanitizedStderr = sanitizeOutput(result.stderr, workspace.runDir, config.defaultFileName);

    if (result.spawnError) {
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Node.js runtime failed to launch or is unavailable on the server.",
        executionTime: result.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (result.exitCode !== 0) {
      const isSyntaxError = /SyntaxError/.test(sanitizedStderr);
      const isOutOfMemory = /JavaScript heap out of memory|Allocation failed/.test(sanitizedStderr);

      let status = "RUNTIME_ERROR";
      let compilationStatus = "SUCCESS";
      let executionStatus = "RUNTIME_ERROR";

      if (isSyntaxError) {
        status = "COMPILATION_ERROR";
        compilationStatus = "COMPILATION_ERROR";
        executionStatus = null;
      } else if (isOutOfMemory) {
        status = "MEMORY_LIMIT_EXCEEDED";
        executionStatus = "MEMORY_LIMIT_EXCEEDED";
      }

      return {
        status,
        compilationStatus,
        executionStatus,
        output: sanitizedStdout,
        error: sanitizedStderr || "Program terminated with an error.",
        executionTime: result.executionTime,
        memoryUsage: isOutOfMemory ? "128MB (Exceeded)" : null,
        exitCode: result.exitCode,
      };
    }

    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: sanitizedStdout,
      error: null,
      executionTime: result.executionTime,
      memoryUsage: null,
      exitCode: 0,
    };
  } finally {
    cleanupWorkspace(workspace.runDir);
  }
}

module.exports = {
  executeJavaScript,
};
