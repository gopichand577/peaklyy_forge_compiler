/**
 * Suite 6: API Contract & Lifecycle Verification
 * 
 * Verifies HTTP status codes, schema validation, error payload structure,
 * and boundary condition handling for /api/compiler/run, /api/compiler/languages,
 * and /api/health.
 */

const { BASE_URL } = require("../helpers/apiClient");

async function runApiContractTests(collector) {
  const suite = "API Contract & Lifecycle Tests";
  const category = "API Contracts & Validation";

  // 1. Health check endpoint contract
  {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      const isHealthOk = res.status === 200 && (data.status === "OK" || data.status === "ok");

      collector.record({
        suite,
        category,
        name: "GET /api/health returns HTTP 200 and status OK",
        language: "api",
        status: isHealthOk ? "PASS" : "FAIL",
        expected: "HTTP 200, status: OK",
        actual: `HTTP ${res.status}, status: ${data.status}`,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      collector.record({
        suite,
        category,
        name: "GET /api/health returns HTTP 200 and status OK",
        language: "api",
        status: "FAIL",
        expected: "HTTP 200",
        actual: e.message,
        durationMs: Date.now() - t0,
      });
    }
  }

  // 2. Languages metadata endpoint contract
  {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/compiler/languages`);
      const data = await res.json();
      const isSchemaValid =
        res.status === 200 &&
        data.success === true &&
        typeof data.languages === "object" &&
        Boolean(data.languages.python) &&
        Boolean(data.languages.javascript);

      collector.record({
        suite,
        category,
        name: "GET /api/compiler/languages returns valid schema with language map",
        language: "api",
        status: isSchemaValid ? "PASS" : "FAIL",
        expected: "HTTP 200, success: true, languages map containing python/javascript",
        actual: `HTTP ${res.status}, success=${data?.success}, keys=${Object.keys(data?.languages || {}).length}`,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      collector.record({
        suite,
        category,
        name: "GET /api/compiler/languages returns valid schema with language map",
        language: "api",
        status: "FAIL",
        expected: "HTTP 200",
        actual: e.message,
        durationMs: Date.now() - t0,
      });
    }
  }

  // Helper for POST /api/compiler/run
  async function postRun(payload, rawBody = null) {
    const res = await fetch(`${BASE_URL}/api/compiler/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: rawBody !== null ? rawBody : JSON.stringify(payload),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // 3. Valid execution response schema
  {
    const t0 = Date.now();
    const res = await postRun({
      language: "python",
      code: 'print("Contract Test")',
      input: "",
    });

    const d = res.data || {};
    const hasRequiredFields =
      typeof d.success === "boolean" &&
      typeof d.status === "string" &&
      typeof d.output === "string" &&
      typeof d.executionTime === "number" &&
      ("error" in d) &&
      ("exitCode" in d);

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run returns complete execution schema on success",
      language: "api",
      status: res.status === 200 && hasRequiredFields ? "PASS" : "FAIL",
      expected: "HTTP 200 with fields {success, status, output, error, executionTime, exitCode}",
      actual: `HTTP ${res.status}, validSchema=${hasRequiredFields}`,
      durationMs: Date.now() - t0,
    });
  }

  // 4. Missing language parameter -> HTTP 400
  {
    const t0 = Date.now();
    const res = await postRun({ code: 'print("No Lang")' });
    const isPass = res.status === 400 && res.data?.success === false;

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects missing language parameter (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400, success: false",
      actual: `HTTP ${res.status}, success=${res.data?.success}`,
      durationMs: Date.now() - t0,
      details: res.data?.error,
    });
  }

  // 5. Unsupported language parameter -> HTTP 400
  {
    const t0 = Date.now();
    const res = await postRun({
      language: "brainfuck_xyz",
      code: "++++",
    });
    const isPass = res.status === 400 && res.data?.success === false;

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects unsupported language (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400 with unsupported language message",
      actual: `HTTP ${res.status}, error=${res.data?.error?.slice(0, 60)}`,
      durationMs: Date.now() - t0,
    });
  }

  // 6. Missing code parameter -> HTTP 400
  {
    const t0 = Date.now();
    const res = await postRun({ language: "python" });
    const isPass = res.status === 400 && res.data?.success === false;

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects missing code parameter (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400, success: false",
      actual: `HTTP ${res.status}, success=${res.data?.success}`,
      durationMs: Date.now() - t0,
      details: res.data?.error,
    });
  }

  // 7. Non-string code data type -> HTTP 400
  {
    const t0 = Date.now();
    const res = await postRun({
      language: "python",
      code: 12345678,
    });
    const isPass = res.status === 400 && res.data?.success === false;

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects non-string code data type (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400, error stating code must be string",
      actual: `HTTP ${res.status}, error=${res.data?.error?.slice(0, 60)}`,
      durationMs: Date.now() - t0,
    });
  }

  // 8. Oversized source code payload (> 64 KB limit) -> HTTP 400
  {
    const t0 = Date.now();
    const oversizedCode = 'print("x")\n' + "# comment\n".repeat(8000); // ~80 KB
    const res = await postRun({
      language: "python",
      code: oversizedCode,
    });
    const isPass = res.status === 400 && res.data?.error?.includes("Source code size exceeds");

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects oversized source code payload (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400, Source code size exceeds allowed limit",
      actual: `HTTP ${res.status}, error=${res.data?.error?.slice(0, 60)}`,
      durationMs: Date.now() - t0,
    });
  }

  // 9. Oversized stdin payload (> 64 KB limit) -> HTTP 400
  {
    const t0 = Date.now();
    const oversizedInput = "input_data_chunk\n".repeat(5000); // ~85 KB
    const res = await postRun({
      language: "python",
      code: "x = input()",
      input: oversizedInput,
    });
    const isPass = res.status === 400 && res.data?.error?.includes("Standard input size exceeds");

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run rejects oversized stdin payload (HTTP 400)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 400, Standard input size exceeds allowed limit",
      actual: `HTTP ${res.status}, error=${res.data?.error?.slice(0, 60)}`,
      durationMs: Date.now() - t0,
    });
  }

  // 10. Empty string code execution (Valid payload) -> SUCCESS with empty/default output
  {
    const t0 = Date.now();
    const res = await postRun({
      language: "python",
      code: "",
      input: "",
    });
    const isPass = res.status === 200 && res.data?.status === "SUCCESS";

    collector.record({
      suite,
      category,
      name: "POST /api/compiler/run handles empty source code string safely (HTTP 200)",
      language: "api",
      status: isPass ? "PASS" : "FAIL",
      expected: "HTTP 200, status: SUCCESS",
      actual: `HTTP ${res.status}, status=${res.data?.status}`,
      durationMs: Date.now() - t0,
    });
  }
}

module.exports = {
  runApiContractTests,
};
