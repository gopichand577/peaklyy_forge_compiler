/**
 * Peaklyy Forge - Compiler Service Dispatcher (P0 Only)
 */

const { LANGUAGE_CONFIG } = require("../config/languages");
const { executePython } = require("./compilers/pythonRunner");
const { executeJavaScript } = require("./compilers/javascriptRunner");
const { executeTypeScript } = require("./compilers/typescriptRunner");
const { executeJava } = require("./compilers/javaRunner");
const { executeCSharp } = require("./compilers/csharpRunner");
const { executeC } = require("./compilers/cRunner");
const { executeCpp } = require("./compilers/cppRunner");
const { executeGo } = require("./compilers/goRunner");
const { executeRust } = require("./compilers/rustRunner");
const { executePhp } = require("./compilers/phpRunner");
const { executeRuby } = require("./compilers/rubyRunner");
const { executeDart } = require("./compilers/dartRunner");
const { executeKotlin } = require("./compilers/kotlinRunner");

/**
 * Dispatches code execution to the respective language runner.
 * @param {string} language - Target language ID
 * @param {string} code - Source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
const executeCode = async (language, code, input = "") => {
  const normalizedLang = (language || "").toLowerCase().trim();
  const config = LANGUAGE_CONFIG[normalizedLang];

  if (!config) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: `Unsupported language: '${language}'. Supported languages: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  // Handle preview-only languages (HTML / CSS)
  if (config.executionMode === "preview") {
    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: `${config.name} rendered successfully in live preview. No compiler/runtime output.`,
      error: null,
      executionTime: 0,
      memoryUsage: null,
      exitCode: 0,
    };
  }

  // Check if runtime is available on the host environment
  if (config.detect) {
    const detection = config.detect();
    if (!detection.available) {
      const reason = detection.blockingReason || `${config.name} compiler/runtime is not currently installed or configured in the system environment. Please install the ${config.name} compiler on the host machine to execute this language.`;
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: reason,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      };
    }
  }

  switch (normalizedLang) {
    case "python":
      return await executePython(code, input);

    case "javascript":
      return await executeJavaScript(code, input);

    case "typescript":
      return await executeTypeScript(code, input);

    case "java":
      return await executeJava(code, input);

    case "csharp":
      return await executeCSharp(code, input);

    case "c":
      return await executeC(code, input);

    case "cpp":
      return await executeCpp(code, input);

    case "go":
      return await executeGo(code, input);

    case "rust":
      return await executeRust(code, input);

    case "php":
      return await executePhp(code, input);

    case "ruby":
      return await executeRuby(code, input);

    case "dart":
      return await executeDart(code, input);

    case "kotlin":
      return await executeKotlin(code, input);

    default:
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Language '${config.name}' is recognized, but execution runner requires local runtime setup on this machine.`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      };
  }
};

module.exports = {
  executeCode,
};