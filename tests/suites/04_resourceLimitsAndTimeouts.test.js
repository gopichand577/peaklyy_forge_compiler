/**
 * Suite 4: Timeout, Resource Limits, and Process Handling
 * 
 * Verifies that infinite loops, deep recursion, excessive output,
 * and memory constraints are safely handled and contained without
 * crashing the backend or leaving dangling processes or temp directories.
 */

const { executeCodeApi } = require("../helpers/apiClient");
const fs = require("fs");
const path = require("path");

async function runResourceLimitTests(collector) {
  const suite = "Resource Limits & Process Handling";

  // 1. Python Infinite Loop -> TIME_LIMIT_EXCEEDED
  {
    const category = "Execution Timeout Enforcement";
    const lang = "python";
    const t0 = Date.now();
    const res = await executeCodeApi(lang, "import time\nwhile True:\n    pass");
    const duration = Date.now() - t0;
    const isTimeout =
      res.data?.status === "TIME_LIMIT_EXCEEDED" ||
      res.data?.executionStatus === "TIME_LIMIT_EXCEEDED";

    collector.record({
      suite,
      category,
      name: "PYTHON - Infinite loop timeout enforcement",
      language: lang,
      status: isTimeout ? "PASS" : "FAIL",
      expected: "TIME_LIMIT_EXCEEDED within ~5s window",
      actual: `status=${res.data?.status}, duration=${duration}ms`,
      durationMs: duration,
      details: res.data?.error,
    });
  }

  // 2. JavaScript Infinite Loop -> TIME_LIMIT_EXCEEDED
  {
    const category = "Execution Timeout Enforcement";
    const lang = "javascript";
    const t0 = Date.now();
    const res = await executeCodeApi(lang, "while (true) {}");
    const duration = Date.now() - t0;
    const isTimeout =
      res.data?.status === "TIME_LIMIT_EXCEEDED" ||
      res.data?.executionStatus === "TIME_LIMIT_EXCEEDED";

    collector.record({
      suite,
      category,
      name: "JAVASCRIPT - Infinite loop timeout enforcement",
      language: lang,
      status: isTimeout ? "PASS" : "FAIL",
      expected: "TIME_LIMIT_EXCEEDED within ~5s window",
      actual: `status=${res.data?.status}, duration=${duration}ms`,
      durationMs: duration,
      details: res.data?.error,
    });
  }

  // 3. Excessive Output Generation -> OUTPUT_LIMIT_EXCEEDED or Truncation
  {
    const category = "Output Buffer Protection";
    const lang = "python";
    const t0 = Date.now();
    // Generates 400KB of output (limit is 256KB)
    const code = `
block = "A" * 1024
for _ in range(400):
    print(block)
`;
    const res = await executeCodeApi(lang, code);
    const duration = Date.now() - t0;
    const isContained =
      res.data?.status === "OUTPUT_LIMIT_EXCEEDED" ||
      res.data?.executionStatus === "OUTPUT_LIMIT_EXCEEDED" ||
      (res.data?.output && res.data.output.length <= 300 * 1024);

    collector.record({
      suite,
      category,
      name: "PYTHON - Excessive output limit protection (256 KB threshold)",
      language: lang,
      status: isContained ? "PASS" : "FAIL",
      expected: "OUTPUT_LIMIT_EXCEEDED or safely bounded buffer",
      actual: `status=${res.data?.status}, outputLength=${res.data?.output?.length || 0} bytes`,
      durationMs: duration,
      details: res.data?.error || `Contained at ${res.data?.output?.length || 0} bytes`,
    });
  }

  // 4. Deep Recursion / Stack Overflow Containment
  {
    const category = "Stack Overflow & Recursion Containment";

    // Python Recursion
    const tPy = Date.now();
    const pyRecRes = await executeCodeApi(lang = "python", "def recurse():\n    return recurse()\nrecurse()");
    const isPyRec =
      pyRecRes.data?.status === "RUNTIME_ERROR" &&
      pyRecRes.data?.error?.includes("RecursionError");
    collector.record({
      suite,
      category,
      name: "PYTHON - Deep recursion containment (RecursionError)",
      language: "python",
      status: isPyRec ? "PASS" : "FAIL",
      expected: "RUNTIME_ERROR with RecursionError",
      actual: `status=${pyRecRes.data?.status}, error contains RecursionError: ${isPyRec}`,
      durationMs: Date.now() - tPy,
    });

    // JavaScript Stack Overflow
    const tJs = Date.now();
    const jsRecRes = await executeCodeApi("javascript", "function f() { f(); } f();");
    const isJsRec =
      jsRecRes.data?.status === "RUNTIME_ERROR" &&
      (jsRecRes.data?.error?.includes("Maximum call stack size exceeded") ||
       jsRecRes.data?.error?.includes("RangeError"));
    collector.record({
      suite,
      category,
      name: "JAVASCRIPT - Deep recursion containment (RangeError)",
      language: "javascript",
      status: isJsRec ? "PASS" : "FAIL",
      expected: "RUNTIME_ERROR with RangeError / call stack exceeded",
      actual: `status=${jsRecRes.data?.status}, error contains RangeError: ${isJsRec}`,
      durationMs: Date.now() - tJs,
    });
  }

  // 5. Temporary Directory Cleanup Verification
  {
    const category = "Sandbox Cleanup & Resource Recovery";
    const t0 = Date.now();
    const tempBasePath = path.join(__dirname, "..", "..", "server", "temp");

    let initialCount = 0;
    if (fs.existsSync(tempBasePath)) {
      initialCount = fs.readdirSync(tempBasePath).length;
    }

    // Run 5 rapid executions
    for (let i = 0; i < 5; i++) {
      await executeCodeApi("python", `print("Temp test run ${i}")`);
    }

    let finalCount = 0;
    if (fs.existsSync(tempBasePath)) {
      finalCount = fs.readdirSync(tempBasePath).length;
    }

    // Temp folders should be removed or cleaned up in `finally`
    const isClean = finalCount <= initialCount + 1;

    collector.record({
      suite,
      category,
      name: "WORKSPACE - Execution temp directories cleaned up after execution",
      language: "general",
      status: isClean ? "PASS" : "FAIL",
      expected: "Temporary execution directories cleaned up on completion",
      actual: `initialDirs=${initialCount}, finalDirs=${finalCount}`,
      durationMs: Date.now() - t0,
    });
  }

  // 6. Server Responsiveness & Recovery Post-Timeout
  {
    const category = "Server Responsiveness & Worker Recovery";
    const t0 = Date.now();
    // Run valid program immediately after timeout tests
    const recoveryRes = await executeCodeApi("python", 'print("Peaklyy Worker Healthy")');
    const isHealthy =
      recoveryRes.data?.status === "SUCCESS" &&
      recoveryRes.data?.output?.trim() === "Peaklyy Worker Healthy";

    collector.record({
      suite,
      category,
      name: "SYSTEM - Backend remains healthy and responsive after timeout/errors",
      language: "system",
      status: isHealthy ? "PASS" : "FAIL",
      expected: "Immediate successful execution of valid program",
      actual: `status=${recoveryRes.data?.status}, output=${recoveryRes.data?.output?.trim()}`,
      durationMs: Date.now() - t0,
    });
  }
}

module.exports = {
  runResourceLimitTests,
};
