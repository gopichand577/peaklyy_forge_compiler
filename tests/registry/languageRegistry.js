/**
 * Peaklyy Forge - Language Capability Registry
 * 
 * Machine-readable registry recording the exact capability, execution mode,
 * detected compiler availability, and supported features for all 16 languages.
 */

const { LANGUAGE_CONFIG, getLanguageAvailability } = require("../../server/config/languages");

function buildLanguageCapabilityRegistry() {
  const serverAvailability = getLanguageAvailability();
  const registry = {};

  const ALL_LANGUAGES = [
    "python",
    "java",
    "c",
    "cpp",
    "javascript",
    "typescript",
    "csharp",
    "go",
    "rust",
    "php",
    "kotlin",
    "swift",
    "ruby",
    "dart",
    "html",
    "css",
  ];

  for (const lang of ALL_LANGUAGES) {
    const config = LANGUAGE_CONFIG[lang];
    const serverInfo = serverAvailability[lang] || {};

    if (!config) {
      registry[lang] = {
        id: lang,
        name: lang,
        isConfigured: false,
        status: "UNCONFIGURED",
        isExecutable: false,
        executionMode: "none",
        runtimeAvailable: false,
        features: {},
      };
      continue;
    }

    const isPreview = config.executionMode === "preview";
    const isAvailable = Boolean(serverInfo.available);

    let status = "BLOCKED_NO_RUNTIME";
    if (isPreview) {
      status = "PREVIEW_ONLY";
    } else if (isAvailable) {
      status = "AVAILABLE";
    }

    registry[lang] = {
      id: lang,
      name: config.name,
      extension: config.extension,
      defaultFileName: config.defaultFileName,
      isConfigured: true,
      status,
      isExecutable: !isPreview,
      executionMode: config.executionMode,
      runtimeAvailable: isAvailable,
      timeoutMs: config.timeout || 10000,
      maxOutputBytes: config.maxOutputSize || 512 * 1024,
      features: {
        stdin: !isPreview,
        stdout: !isPreview,
        stderr: !isPreview,
        processIsolation: !isPreview,
        compilation: config.executionMode === "compiled",
        livePreview: isPreview,
      },
      blockingReason: isAvailable
        ? null
        : `${config.name} compiler/runtime is not installed on the host operating system.`,
    };
  }

  return registry;
}

module.exports = {
  buildLanguageCapabilityRegistry,
};
