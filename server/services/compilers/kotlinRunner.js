/**
 * Peaklyy Forge - Kotlin Compilation & Execution Runner (P0)
 */

const path = require("path");
const { LANGUAGE_CONFIG, detectJava } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Compiles and executes Kotlin source code with strict resource controls.
 * @param {string} code - Kotlin source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeKotlin(code, input = "") {
  const config = LANGUAGE_CONFIG.kotlin;
  const detection = config.detect();
  const javaDetection = detectJava();

  if (!detection.available || !javaDetection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Kotlin compiler (kotlinc) or Java runtime (java) is not installed on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace("Main.kt", code);
  const jarPath = path.join(workspace.runDir, "Main.jar");

  // Java & Kotlin environment
  const env = {
    JAVA_HOME: javaDetection.javaHome || "",
    PATH: `${javaDetection.binDir || ""}${path.delimiter}${process.env.PATH || ""}`,
  };

  try {
    // 1. Compilation Phase
    const compileResult = await runProcess(
      detection.command,
      ["Main.kt", "-include-runtime", "-d", "Main.jar"],
      {
        cwd: workspace.runDir,
        env,
        timeout: 15000,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (compileResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: "Compilation timed out (15s limit exceeded).",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (compileResult.exitCode !== 0) {
      const err = sanitizeOutput(
        compileResult.stderr || compileResult.stdout || "Compilation failed",
        workspace.runDir,
        "Main.kt"
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
      javaDetection.java,
      ["-jar", jarPath],
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "Main.kt"),
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
        output: sanitizeOutput(runResult.stdout, workspace.runDir, "Main.kt"),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: runResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(runResult.stdout, workspace.runDir, "Main.kt");
    const sanitizedStderr = sanitizeOutput(runResult.stderr, workspace.runDir, "Main.kt");

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
  executeKotlin,
};
