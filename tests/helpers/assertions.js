/**
 * Peaklyy Forge - Structured Test Assertions & Results Accumulator
 */

class TestCollector {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  record({
    suite,
    category,
    name,
    language = "general",
    status, // "PASS" | "FAIL" | "BLOCKED" | "SKIPPED" | "UNVERIFIED"
    expected = null,
    actual = null,
    durationMs = 0,
    error = null,
    details = "",
  }) {
    this.results.push({
      suite,
      category,
      name,
      language,
      status,
      expected: expected !== null ? String(expected) : null,
      actual: actual !== null ? String(actual) : null,
      durationMs: Math.round(durationMs),
      error: error ? (error.message || String(error)) : null,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const blocked = this.results.filter((r) => r.status === "BLOCKED").length;
    const skipped = this.results.filter((r) => r.status === "SKIPPED").length;
    const unverified = this.results.filter((r) => r.status === "UNVERIFIED").length;
    const durationMs = Date.now() - this.startTime;

    const byLanguage = {};
    for (const r of this.results) {
      byLanguage[r.language] = byLanguage[r.language] || { PASS: 0, FAIL: 0, BLOCKED: 0, SKIPPED: 0, UNVERIFIED: 0, total: 0 };
      byLanguage[r.language][r.status] = (byLanguage[r.language][r.status] || 0) + 1;
      byLanguage[r.language].total += 1;
    }

    const byCategory = {};
    for (const r of this.results) {
      byCategory[r.category] = byCategory[r.category] || { PASS: 0, FAIL: 0, BLOCKED: 0, SKIPPED: 0, UNVERIFIED: 0, total: 0 };
      byCategory[r.category][r.status] = (byCategory[r.category][r.status] || 0) + 1;
      byCategory[r.category].total += 1;
    }

    return {
      total,
      passed,
      failed,
      blocked,
      skipped,
      unverified,
      durationMs,
      byLanguage,
      byCategory,
      results: this.results,
    };
  }
}

module.exports = {
  TestCollector,
};
