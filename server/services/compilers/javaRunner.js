/**
 * Peaklyy Forge - Java Compilation & Execution Runner (P0)
 */

const path = require("path");
const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

/**
 * Extracts class name from Java source code. Defaults to "Main".
 * @param {string} code 
 * @returns {string}
 */
function extractClassName(code) {
  const cleanCode = (code || "").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
  const publicClassMatch = cleanCode.match(/public\s+(?:final\s+)?class\s+([A-Za-z0-9_$]+)/);
  if (publicClassMatch) {
    return publicClassMatch[1];
  }
  const classMatch = cleanCode.match(/class\s+([A-Za-z0-9_$]+)/);
  if (classMatch) {
    return classMatch[1];
  }
  return "Main";
}

/**
 * Compiles and executes Java source code with strict resource controls.
 * @param {string} code - Java source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executeJava(code, input = "") {
  const config = LANGUAGE_CONFIG.java;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Java Development Kit (javac / java) is not installed or configured on the server environment. Please configure JDK in PATH or JAVA_HOME.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const className = extractClassName(code);
  const sourceFileName = `${className}.java`;
  const workspace = createExecutionWorkspace(sourceFileName, code);

  // Set up JDK execution environment
  const javaEnv = {};
  if (detection.binDir) {
    javaEnv.PATH = `${detection.binDir}${path.delimiter}${process.env.PATH || ""}`;
  }
  if (detection.javaHome) {
    javaEnv.JAVA_HOME = detection.javaHome;
  }

  try {
    // 1. Compilation Phase
    const compileResult = await runProcess(
      detection.javac,
      ["-encoding", "UTF-8", sourceFileName],
      {
        cwd: workspace.runDir,
        env: javaEnv,
        timeout: 5000,
        maxOutputSize: config.maxOutputSize,
      }
    );

    if (compileResult.spawnError) {
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Java compiler (javac) failed to launch or is not accessible on the server.",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (compileResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: "Compilation timed out (5s limit exceeded).",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (compileResult.exitCode !== 0) {
      const sanitizedCompileErr = sanitizeOutput(
        compileResult.stderr || compileResult.stdout,
        workspace.runDir,
        sourceFileName
      );

      const isConfigError = /not recognized as an internal or external command|No such file or directory/i.test(sanitizedCompileErr);
      if (isConfigError) {
        return {
          status: "SYSTEM_ERROR",
          compilationStatus: null,
          executionStatus: null,
          output: "",
          error: "Java Development Kit compiler (javac) is not available or configured on this server environment.",
          executionTime: compileResult.executionTime,
          memoryUsage: null,
          exitCode: null,
        };
      }

      return {
        status: "COMPILATION_ERROR",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: sanitizedCompileErr || "Compilation failed.",
        executionTime: compileResult.executionTime,
        memoryUsage: null,
        exitCode: compileResult.exitCode,
      };
    }

    // 2. Execution Phase
    const execResult = await runProcess(
      detection.java,
      ["-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8", "-Xmx128m", "-cp", ".", className],
      {
        cwd: workspace.runDir,
        env: javaEnv,
        input,
        timeout: config.timeout,
        maxOutputSize: config.maxOutputSize,
      }
    );

    const totalTime = Math.round((compileResult.executionTime + execResult.executionTime) * 1000) / 1000;

    if (execResult.spawnError) {
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: "SUCCESS",
        executionStatus: null,
        output: "",
        error: "Java runtime (java) failed to launch or is not accessible on the server.",
        executionTime: totalTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (execResult.timedOut) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "TIME_LIMIT_EXCEEDED",
        output: sanitizeOutput(execResult.stdout, workspace.runDir, sourceFileName),
        error: `Time Limit Exceeded (Execution exceeded ${config.timeout / 1000}s limit).`,
        executionTime: totalTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (execResult.outputLimitExceeded) {
      return {
        status: "OUTPUT_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "OUTPUT_LIMIT_EXCEEDED",
        output: sanitizeOutput(execResult.stdout, workspace.runDir, sourceFileName),
        error: `Output Limit Exceeded (Output exceeded ${config.maxOutputSize / 1024} KB).`,
        executionTime: totalTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    const sanitizedStdout = sanitizeOutput(execResult.stdout, workspace.runDir, sourceFileName);
    const sanitizedStderr = sanitizeOutput(execResult.stderr, workspace.runDir, sourceFileName);

    if (execResult.exitCode !== 0) {
      const isOutOfMemory = /java\.lang\.OutOfMemoryError/.test(sanitizedStderr);

      return {
        status: isOutOfMemory ? "MEMORY_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
        compilationStatus: "SUCCESS",
        executionStatus: isOutOfMemory ? "MEMORY_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
        output: sanitizedStdout,
        error: sanitizedStderr || "Program terminated with an error.",
        executionTime: totalTime,
        memoryUsage: isOutOfMemory ? "128MB (Exceeded)" : null,
        exitCode: execResult.exitCode,
      };
    }

    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: sanitizedStdout,
      error: null,
      executionTime: totalTime,
      memoryUsage: null,
      exitCode: 0,
    };
  } finally {
    cleanupWorkspace(workspace.runDir);
  }
}

module.exports = {
  executeJava,
};
