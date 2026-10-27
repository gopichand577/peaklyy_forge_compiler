/**
 * Peaklyy Forge - Compiler Controller (P0 Only)
 */

const { executeCode } = require("../services/compilerService");
const { executionQueue } = require("../services/executionQueue");
const { DEFAULT_LIMITS, LANGUAGE_CONFIG, getLanguageAvailability } = require("../config/languages");

/**
 * Returns supported languages and real environment runtime availability.
 */
const getLanguages = (req, res) => {
  return res.status(200).json({
    success: true,
    languages: getLanguageAvailability(),
  });
};

/**
 * Returns real-time queue capacity, active workers, and execution telemetry.
 */
const getStats = (req, res) => {
  return res.status(200).json({
    success: true,
    queue: executionQueue.getStats(),
    percentiles: executionQueue.getPercentiles(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Executes source code in sandbox environment.
 */
const runCode = async (req, res) => {
  try {
    const { language, code, input, stdin } = req.body || {};
    const rawInput = stdin !== undefined ? stdin : input;

    // 1. Validation: Language
    if (!language || typeof language !== "string") {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Missing or invalid 'language' parameter. A valid string is required.",
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    const normalizedLang = language.toLowerCase().trim();
    if (!LANGUAGE_CONFIG[normalizedLang]) {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Unsupported language: '${language}'. Supported languages: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    // 2. Validation: Code
    if (code === undefined || code === null || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Missing or invalid 'code' parameter. Source code must be a string.",
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    if (Buffer.byteLength(code, "utf8") > DEFAULT_LIMITS.MAX_CODE_BYTES) {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Source code size exceeds the allowed limit of ${DEFAULT_LIMITS.MAX_CODE_BYTES / 1024} KB.`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    // 3. Validation: Input (stdin)
    let sanitizedInput = "";
    if (rawInput !== undefined && rawInput !== null) {
      if (typeof rawInput !== "string") {
        sanitizedInput = String(rawInput);
      } else {
        sanitizedInput = rawInput;
      }

      if (Buffer.byteLength(sanitizedInput, "utf8") > DEFAULT_LIMITS.MAX_INPUT_BYTES) {
        return res.status(400).json({
          success: false,
          status: "SYSTEM_ERROR",
          compilationStatus: null,
          executionStatus: null,
          output: "",
          error: `Standard input size exceeds the allowed limit of ${DEFAULT_LIMITS.MAX_INPUT_BYTES / 1024} KB.`,
          executionTime: 0,
          memoryUsage: null,
          exitCode: null,
        });
      }
    }

    // 4. Execution (routed through bounded executionQueue with fair scheduling)
    const clientKey = req.headers["x-client-id"] || req.ip || req.socket.remoteAddress || "127.0.0.1";

    let result;
    if (LANGUAGE_CONFIG[normalizedLang] && LANGUAGE_CONFIG[normalizedLang].executionMode === "preview") {
      // Preview languages (HTML/CSS) render in frontend and do not require compiler subprocesses
      result = await executeCode(normalizedLang, code, sanitizedInput);
    } else {
      result = await executionQueue.enqueue(
        () => executeCode(normalizedLang, code, sanitizedInput),
        { clientKey }
      );
    }

    return res.status(200).json({
      success: result.status === "SUCCESS",
      status: result.status,
      compilationStatus: result.compilationStatus,
      executionStatus: result.executionStatus,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      queueWaitTime: result.queueWaitTime || 0,
      memoryUsage: result.memoryUsage,
      exitCode: result.exitCode,
    });
  } catch (err) {
    if (err && (err.code === "CLIENT_ABORTED" || req.destroyed || res.writableEnded)) {
      return;
    }
    if (err && err.code === "QUEUE_FULL") {
      res.setHeader("Retry-After", String(err.retryAfter || 2));
      return res.status(503).json({
        success: false,
        status: "QUEUE_FULL",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: err.message,
        executionTime: 0,
        queueWaitTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    if (err && err.code === "QUEUE_TIMEOUT") {
      return res.status(504).json({
        success: false,
        status: "QUEUE_TIMEOUT",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: err.message,
        executionTime: 0,
        queueWaitTime: executionQueue.queueTimeoutMs,
        memoryUsage: null,
        exitCode: null,
      });
    }

    console.error("Internal Forge Server Error:", err);
    return res.status(500).json({
      success: false,
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Internal server error occurred while processing execution request.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    });
  }
};

module.exports = {
  runCode,
  getLanguages,
  getStats,
};