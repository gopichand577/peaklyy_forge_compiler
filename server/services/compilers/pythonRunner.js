/**
 * Peaklyy Forge - Python Execution Runner (P0)
 */

const fs = require("fs");
const path = require("path");
const { LANGUAGE_CONFIG } = require("../../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../../utils/tempManager");
const { runProcess } = require("../../utils/processRunner");
const { sanitizeOutput } = require("../../utils/sanitizer");

const RUNNER_SCRIPT = `import builtins
_orig_input = builtins.input
def _clean_input(prompt=None):
    return _orig_input()
builtins.input = _clean_input

if __name__ == "__main__":
    with open("main.py", "rb") as f:
        code_bytes = f.read()
    compiled = compile(code_bytes, "main.py", "exec")
    exec(compiled, {"__name__": "__main__", "__file__": "main.py", "__builtins__": builtins})
`;

/**
 * Executes Python code with resource limits and stdin support.
 * @param {string} code - Python code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
async function executePython(code, input = "") {
  const config = LANGUAGE_CONFIG.python;
  const detection = config.detect();

  if (!detection.available) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Python 3 interpreter is not installed or configured on the server environment.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  const workspace = createExecutionWorkspace(config.defaultFileName, code);
  fs.writeFileSync(path.join(workspace.runDir, "_runner.py"), RUNNER_SCRIPT, "utf8");

  try {
    const result = await runProcess(
      detection.command,
      ["-u", "-X", "utf8", "_runner.py"],
      {
        cwd: workspace.runDir,
        input,
        timeout: config.timeout,
        maxOutputSize: config.maxOutputSize,
      }
    );

    // Timeout handling
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

    // Output limit handling
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

    // Check spawn error
    if (result.spawnError) {
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Python 3 interpreter failed to launch or is unavailable on the server.",
        executionTime: result.executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    // Check exit code
    if (result.exitCode !== 0) {
      const isSyntaxError = /SyntaxError|IndentationError|TabError/.test(sanitizedStderr);
      const isOutOfMemory = /MemoryError/.test(sanitizedStderr);

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

      let finalError = sanitizedStderr || "Program terminated with an error.";
      if (/EOFError:\s*EOF when reading a line/i.test(finalError) && (!input || !input.trim())) {
        finalError += "\n\nNote: Standard input (stdin) was empty. Please provide your input in the 'Input (stdin)' panel before clicking Run.";
      }

      return {
        status,
        compilationStatus,
        executionStatus,
        output: sanitizedStdout,
        error: finalError,
        executionTime: result.executionTime,
        memoryUsage: isOutOfMemory ? "Memory Limit Exceeded" : null,
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
  executePython,
};
