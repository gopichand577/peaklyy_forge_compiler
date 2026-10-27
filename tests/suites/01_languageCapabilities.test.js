/**
 * Suite 1: Language Capability & Registry Verification
 */

const { buildLanguageCapabilityRegistry } = require("../registry/languageRegistry");
const { getLanguagesApi } = require("../helpers/apiClient");

async function runLanguageCapabilityTests(collector) {
  const suite = "Language Capability Tests";
  const category = "Registry & Metadata";

  const registry = buildLanguageCapabilityRegistry();
  const apiResponse = await getLanguagesApi();

  const TARGET_LANGUAGES = [
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

  // 1. Verify all 16 languages are in registry
  const t0 = Date.now();
  const allPresent = TARGET_LANGUAGES.every((lang) => Boolean(registry[lang]));
  collector.record({
    suite,
    category,
    name: "All 16 target languages defined in capability registry",
    language: "all",
    status: allPresent ? "PASS" : "FAIL",
    expected: "16 languages registered",
    actual: `${Object.keys(registry).length} languages found`,
    durationMs: Date.now() - t0,
  });

  // 2. Verify API returns status 200 and success
  const t1 = Date.now();
  collector.record({
    suite,
    category,
    name: "API endpoint GET /api/compiler/languages returns success: true",
    language: "api",
    status: apiResponse.ok && apiResponse.data?.success ? "PASS" : "FAIL",
    expected: "HTTP 200, success: true",
    actual: `HTTP ${apiResponse.httpStatus}, success: ${apiResponse.data?.success}`,
    durationMs: Date.now() - t1,
  });

  // 3. For each language, check runtime detection truthfulness & configuration
  for (const lang of TARGET_LANGUAGES) {
    const tStart = Date.now();
    const entry = registry[lang];
    const apiEntry = apiResponse.data?.languages?.[lang];

    if (!entry) {
      collector.record({
        suite,
        category,
        name: `Language ${lang} configured`,
        language: lang,
        status: "FAIL",
        expected: `Entry for ${lang}`,
        actual: "Not found",
        durationMs: Date.now() - tStart,
      });
      continue;
    }

    // Check consistency between server registry and API output
    const isConsistent =
      apiEntry &&
      apiEntry.extension === entry.extension &&
      apiEntry.defaultFileName === entry.defaultFileName &&
      apiEntry.available === entry.runtimeAvailable;

    collector.record({
      suite,
      category,
      name: `Language configuration and runtime availability truthfulness (${entry.name})`,
      language: lang,
      status: isConsistent ? "PASS" : "FAIL",
      expected: `available=${entry.runtimeAvailable}, ext=${entry.extension}`,
      actual: apiEntry ? `available=${apiEntry.available}, ext=${apiEntry.extension}` : "No API entry",
      durationMs: Date.now() - tStart,
      details: entry.runtimeAvailable
        ? `Runtime verified active on host`
        : `Runtime truthfully reported as uninstalled: ${entry.blockingReason}`,
    });
  }
}

module.exports = {
  runLanguageCapabilityTests,
};
