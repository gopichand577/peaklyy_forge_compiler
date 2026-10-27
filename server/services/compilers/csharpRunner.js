/**
 * Peaklyy Forge - C# Compiler & Runner (P0)
 * Uses native Windows .NET Framework csc.exe compiler.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile, spawn } = require("child_process");

const CSC_PATH = fs.existsSync("C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe")
  ? "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
  : fs.existsSync("C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe")
  ? "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
  : "csc";

/**
 * Compiles and executes C# code.
 * @param {string} code - C# source code
 * @param {string} [input=""] - Standard input
 * @returns {Promise<object>} Execution result
 */
const executeCSharp = async (code, input = "") => {
  const startTime = Date.now();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "peaklyy-cs-"));
  const sourcePath = path.join(tempDir, "Program.cs");
  const exePath = path.join(tempDir, "app.exe");

  try {
    fs.writeFileSync(sourcePath, code, "utf-8");

    // 1. Compile with csc.exe
    const compileResult = await new Promise((resolve) => {
      execFile(
        CSC_PATH,
        ["/nologo", "/target:exe", `/out:${exePath}`, sourcePath],
        { timeout: 10000, cwd: tempDir },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              error: (stderr || stdout || error.message).trim(),
            });
          } else {
            resolve({ success: true, warnings: stdout.trim() });
          }
        }
      );
    });

    if (!compileResult.success) {
      return {
        status: "COMPILATION_ERROR",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: null,
        output: "",
        error: compileResult.error,
        executionTime: Date.now() - startTime,
        memoryUsage: null,
        exitCode: 1,
      };
    }

    // 2. Execute compiled Program.exe
    const runResult = await new Promise((resolve) => {
      const child = spawn(exePath, [], {
        cwd: tempDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
      }, 7000);

      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (killed) {
          resolve({
            success: false,
            timeout: true,
            output: stdout,
            error: "Execution timed out (7000ms limit).",
            exitCode: null,
          });
        } else {
          resolve({
            success: code === 0,
            output: stdout,
            error: stderr,
            exitCode: code,
          });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output: stdout,
          error: err.message,
          exitCode: 1,
        });
      });
    });

    const executionTime = Date.now() - startTime;

    if (runResult.timeout) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilationStatus: "SUCCESS",
        executionStatus: "TIME_LIMIT_EXCEEDED",
        output: runResult.output || "",
        error: runResult.error,
        executionTime,
        memoryUsage: null,
        exitCode: null,
      };
    }

    if (!runResult.success) {
      return {
        status: "RUNTIME_ERROR",
        compilationStatus: "SUCCESS",
        executionStatus: "RUNTIME_ERROR",
        output: runResult.output || "",
        error: runResult.error || `Process exited with code ${runResult.exitCode}`,
        executionTime,
        memoryUsage: null,
        exitCode: runResult.exitCode,
      };
    }

    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: runResult.output || "",
      error: null,
      executionTime,
      memoryUsage: null,
      exitCode: 0,
    };
  } catch (err) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: err.message,
      executionTime: Date.now() - startTime,
      memoryUsage: null,
      exitCode: 1,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  }
};

module.exports = {
  executeCSharp,
  CSC_PATH,
};
