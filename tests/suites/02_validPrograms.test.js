/**
 * Suite 2: Exhaustive Valid Program Execution Matrix
 * 
 * Tests valid programs, entry points, standard input/output handling,
 * unicode, formatting, multiple test cases, and algorithmic edge cases
 * across all active executable languages.
 */

const { executeCodeApi } = require("../helpers/apiClient");
const { buildLanguageCapabilityRegistry } = require("../registry/languageRegistry");
const { LANGUAGE_TEST_CASES } = require("./languageTestCases");

const BLOCKED_LANGUAGES = [
  "swift",
];

async function runValidProgramTests(collector) {
  const suite = "Valid Programs Execution";
  const category = "Core Execution";
  const registry = buildLanguageCapabilityRegistry();

  // Test active executable languages
  for (const [lang, testCases] of Object.entries(LANGUAGE_TEST_CASES)) {
    const regEntry = registry[lang];
    if (!regEntry || !regEntry.runtimeAvailable) {
      collector.record({
        suite,
        category,
        name: `Language ${lang} valid execution`,
        language: lang,
        status: "BLOCKED",
        details: `Runtime not available: ${regEntry ? regEntry.blockingReason : "Not found"}`,
      });
      continue;
    }

    for (const [caseName, tc] of Object.entries(testCases)) {
      const tStart = Date.now();
      const res = await executeCodeApi(lang, tc.code, tc.input || "");
      const durationMs = Date.now() - tStart;

      const cleanActual = (res.data?.output || "").replace(/\r\n/g, "\n").trim();
      const cleanExpected = (tc.expectedOutput || "").replace(/\r\n/g, "\n").trim();

      let isSuccess = false;
      if (typeof tc.verifier === "function") {
        isSuccess = res.ok && res.data?.success && tc.verifier(cleanActual);
      } else {
        isSuccess = res.ok && res.data?.success && cleanActual === cleanExpected;
      }

      collector.record({
        suite,
        category,
        name: `${lang.toUpperCase()} - ${caseName}`,
        language: lang,
        status: isSuccess ? "PASS" : "FAIL",
        expected: tc.expectedOutput !== undefined ? cleanExpected : "Verifier function pass",
        actual: isSuccess ? cleanActual : (res.data?.error || cleanActual || `status=${res.data?.status}`),
        durationMs,
        details: isSuccess ? `Executed cleanly in ${res.data?.executionTime}s` : `Failed execution: ${res.data?.error || "mismatched output"}`,
      });
    }

    // Repeated executions stability check
    const tRepeat = Date.now();
    const rep1 = await executeCodeApi(lang, testCases.minimal.code, "");
    const rep2 = await executeCodeApi(lang, testCases.minimal.code, "");
    const repeatSuccess = rep1.data?.output?.trim() === testCases.minimal.expectedOutput &&
                          rep2.data?.output?.trim() === testCases.minimal.expectedOutput;

    collector.record({
      suite,
      category,
      name: `${lang.toUpperCase()} - Repeated sequential executions stability`,
      language: lang,
      status: repeatSuccess ? "PASS" : "FAIL",
      expected: "Deterministic identical output on repeated runs",
      actual: repeatSuccess ? "Consistent output" : "Inconsistent execution results",
      durationMs: Date.now() - tRepeat,
    });
  }

  // Record BLOCKED status truthfully only for uninstalled compiler runtimes
  for (const bLang of BLOCKED_LANGUAGES) {
    const regEntry = registry[bLang];
    const isAvailable = Boolean(regEntry?.runtimeAvailable);
    collector.record({
      suite,
      category,
      name: `${bLang.toUpperCase()} - compiler execution capability`,
      language: bLang,
      status: isAvailable ? "PASS" : "BLOCKED",
      expected: "Installed host compiler/runtime",
      actual: isAvailable ? "Runtime verified active on host" : "Runtime not detected on host",
      details: isAvailable
        ? `${regEntry.name} compiler/runtime is active and verified on host`
        : (regEntry?.blockingReason || "Compiler not installed on Windows host"),
    });
  }
}

module.exports = {
  runValidProgramTests,
};
