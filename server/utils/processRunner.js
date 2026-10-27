/**
 * Peaklyy Forge - Secure Process Runner
 * 
 * Executes subprocesses with strict resource controls:
 * - Real-time stdin streaming
 * - Wall-clock timeout enforcement with process tree termination
 * - Output buffer limit tracking
 * - High-resolution execution timing
 * - Sanitized environment
 */

const { spawn, exec } = require("child_process");
const { DEFAULT_LIMITS } = require("../config/languages");

/**
 * Safely kills a process tree to prevent orphan processes.
 * @param {number} pid - Process ID
 */
function killProcessTree(pid) {
  if (!pid) return;

  if (process.platform === "win32") {
    try {
      exec(`taskkill /pid ${pid} /T /F`, { windowsHide: true }, () => {});
    } catch {}
  } else {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  }
}

/**
 * Executes a program with strict resource limits and stdin support.
 * @param {string} command - Executable path or name
 * @param {string[]} args - Command arguments array
 * @param {object} options
 * @param {string} [options.cwd] - Working directory
 * @param {string} [options.input] - Stdin string
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {number} [options.maxOutputSize] - Max output in bytes
 * @param {object} [options.env] - Environment variables
 * @returns {Promise<{
 *   stdout: string,
 *   stderr: string,
 *   exitCode: number | null,
 *   signal: string | null,
 *   timedOut: boolean,
 *   outputLimitExceeded: boolean,
 *   executionTime: number
 * }>}
 */
function runProcess(command, args = [], options = {}) {
  const timeoutMs = options.timeout || DEFAULT_LIMITS.TIMEOUT_MS;
  const maxOutputSize = options.maxOutputSize || DEFAULT_LIMITS.MAX_OUTPUT_BYTES;
  const input = options.input !== undefined && options.input !== null ? String(options.input) : "";

  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    let stdoutChunks = [];
    let stderrChunks = [];
    let totalBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let isSettled = false;

    // Filter environment to avoid passing secrets
    const safeEnv = {
      PATH: process.env.PATH,
      PATHEXT: process.env.PATHEXT,
      SYSTEMROOT: process.env.SYSTEMROOT,
      WINDIR: process.env.WINDIR,
      TMP: process.env.TMP,
      TEMP: process.env.TEMP,
      JAVA_HOME: process.env.JAVA_HOME,
      NODE_PATH: process.env.NODE_PATH,
      PYTHONPATH: "",
      PYTHONIOENCODING: "utf-8",
      ...(options.env || {}),
    };

    let child;
    try {
      const isWindows = process.platform === "win32";
      const isBatchFile = isWindows && /\.(bat|cmd)$/i.test(command);
      const spawnCommand = isBatchFile ? (process.env.COMSPEC || "cmd.exe") : command;
      const spawnArgs = isBatchFile ? ["/c", `"${command}"`, ...args] : args;

      child = spawn(spawnCommand, spawnArgs, {
        cwd: options.cwd || process.cwd(),
        env: safeEnv,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
        windowsVerbatimArguments: isBatchFile,
      });
    } catch (spawnError) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;
      return resolve({
        stdout: "",
        stderr: spawnError.message,
        exitCode: 1,
        signal: null,
        timedOut: false,
        outputLimitExceeded: false,
        executionTime: Math.round(executionTime * 1000) / 1000,
        spawnError: spawnError,
      });
    }

    // Timeout timer with failsafe watchdog
    let forceKillTimer = null;
    const timeoutTimer = setTimeout(() => {
      if (isSettled) return;
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {}
      killProcessTree(child.pid);

      forceKillTimer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1e9;
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8"),
          exitCode: null,
          signal: "SIGKILL",
          timedOut: true,
          outputLimitExceeded,
          executionTime: Math.round(executionTime * 1000) / 1000,
        });
      }, 1500);
    }, timeoutMs);

    // Stdin handling
    if (child.stdin) {
      child.stdin.on("error", () => {
        // Handle EPIPE / broken pipe safely if process exited early
      });

      try {
        if (input !== undefined && input !== null && input.length > 0) {
          const normalizedInput = input.endsWith("\n") ? input : `${input}\n`;
          child.stdin.end(normalizedInput, "utf8");
        } else {
          child.stdin.end();
        }
      } catch {
        // Child closed stdin
      }
    }

    // Stdout handling
    child.stdout.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxOutputSize && !outputLimitExceeded) {
        outputLimitExceeded = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        killProcessTree(child.pid);
        return;
      }
      if (!outputLimitExceeded) {
        stdoutChunks.push(chunk);
      }
    });

    // Stderr handling
    child.stderr.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxOutputSize && !outputLimitExceeded) {
        outputLimitExceeded = true;
        try {
          child.kill("SIGKILL");
        } catch {}
        killProcessTree(child.pid);
        return;
      }
      if (!outputLimitExceeded) {
        stderrChunks.push(chunk);
      }
    });

    // Error handling
    child.on("error", (err) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutTimer);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: err.message,
        exitCode: 1,
        signal: null,
        timedOut: false,
        outputLimitExceeded: false,
        executionTime: Math.round(executionTime * 1000) / 1000,
        spawnError: err,
      });
    });

    // Close handling
    child.on("close", (exitCode, signal) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutTimer);
      if (forceKillTimer) clearTimeout(forceKillTimer);

      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1e9;

      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");

      resolve({
        stdout,
        stderr,
        exitCode: timedOut ? null : exitCode,
        signal,
        timedOut,
        outputLimitExceeded,
        executionTime: Math.round(executionTime * 1000) / 1000,
      });
    });
  });
}

module.exports = {
  runProcess,
  killProcessTree,
};
