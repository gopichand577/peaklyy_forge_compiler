/**
 * Suite 5: Sandbox Security & Isolation Probes
 * 
 * Verifies environment variable protection, path sanitization,
 * workspace containment, and assesses host execution boundaries.
 */

const { executeCodeApi } = require("../helpers/apiClient");

async function runSandboxSecurityTests(collector) {
  const suite = "Sandbox Security & Isolation Tests";

  // 1. Environment Variable Protection (No Server Secrets Leaked)
  {
    const category = "Credential & Secret Protection";
    const lang = "python";
    const t0 = Date.now();
    // Test code attempts to inspect environment variables for common secrets
    const probeCode = `
import os
sensitive_keys = [
    "JWT_SECRET", "SESSION_SECRET", "DB_PASSWORD", "API_KEY",
    "MONGO_URI", "SECRET_KEY", "AWS_SECRET_ACCESS_KEY"
]
found = [k for k in sensitive_keys if k in os.environ]
print("LEAKED_SECRETS_COUNT:", len(found))
`;
    const res = await executeCodeApi(lang, probeCode);
    const leakedCountMatches = res.data?.output?.match(/LEAKED_SECRETS_COUNT:\s*(\d+)/);
    const leakedCount = leakedCountMatches ? parseInt(leakedCountMatches[1], 10) : -1;
    const isSafe = leakedCount === 0;

    collector.record({
      suite,
      category,
      name: "SECURITY - Execution environment filters sensitive server secrets",
      language: lang,
      status: isSafe ? "PASS" : "FAIL",
      expected: "LEAKED_SECRETS_COUNT: 0 (safe filtered environment)",
      actual: res.data?.output?.trim(),
      durationMs: Date.now() - t0,
    });
  }

  // 2. Node.js Environment Variable Protection
  {
    const category = "Credential & Secret Protection";
    const lang = "javascript";
    const t0 = Date.now();
    const probeCode = `
const sensitiveKeys = ["JWT_SECRET", "DATABASE_URL", "API_KEY", "SECRET"];
const leaked = sensitiveKeys.filter(k => Boolean(process.env[k]));
console.log("JS_LEAKED_COUNT:", leaked.length);
`;
    const res = await executeCodeApi(lang, probeCode);
    const leakedMatch = res.data?.output?.match(/JS_LEAKED_COUNT:\s*(\d+)/);
    const leakedCount = leakedMatch ? parseInt(leakedMatch[1], 10) : -1;
    const isSafe = leakedCount === 0;

    collector.record({
      suite,
      category,
      name: "SECURITY - Node.js environment filters application secrets",
      language: lang,
      status: isSafe ? "PASS" : "FAIL",
      expected: "JS_LEAKED_COUNT: 0",
      actual: res.data?.output?.trim(),
      durationMs: Date.now() - t0,
    });
  }

  // 3. Output Sanitizer - Server Host Paths Masking
  {
    const category = "Information Disclosure Protection";
    const lang = "python";
    const t0 = Date.now();
    // Deliberate syntax/runtime error in Python prints traceback
    const res = await executeCodeApi(lang, "1 / 0");
    const err = res.data?.error || "";

    // The output sanitizer should strip out internal absolute server paths like "c:\users\..." or "/home/..."
    // and replace them with relative clean names like "main.py"
    const hasRawServerTempPath = /server[\\\/]temp[\\\/][a-f0-9-]+/i.test(err);

    collector.record({
      suite,
      category,
      name: "SECURITY - Output sanitizer masks internal server temp filepaths in tracebacks",
      language: lang,
      status: !hasRawServerTempPath ? "PASS" : "FAIL",
      expected: "Clean sanitized error message without leaking internal host paths",
      actual: !hasRawServerTempPath ? "Host paths successfully masked" : "Exposed internal temp path",
      durationMs: Date.now() - t0,
      details: err.slice(0, 100),
    });
  }

  // 4. Working Directory Containment
  {
    const category = "Filesystem Isolation";
    const lang = "python";
    const t0 = Date.now();
    const probeCode = `
import os
cwd = os.getcwd()
print("ISOLATED_RUN_DIR:", "run_" in cwd or "temp" in cwd.lower())
`;
    const res = await executeCodeApi(lang, probeCode);
    const isContained = res.data?.output?.includes("ISOLATED_RUN_DIR: True");

    collector.record({
      suite,
      category,
      name: "SECURITY - Subprocess cwd is bound to isolated workspace directory",
      language: lang,
      status: isContained ? "PASS" : "FAIL",
      expected: "ISOLATED_RUN_DIR: True",
      actual: res.data?.output?.trim(),
      durationMs: Date.now() - t0,
    });
  }

  // 5. HTML / XSS Injection Containment in Outputs
  {
    const category = "Output Encoding & Injection Prevention";
    const lang = "python";
    const t0 = Date.now();
    const probeCode = 'print("<script>alert(1)</script><img src=x onerror=alert(2)>")';
    const res = await executeCodeApi(lang, probeCode);
    const isProperlyPassedAsRawText =
      res.data?.status === "SUCCESS" &&
      res.data?.output?.includes("<script>alert(1)</script>");

    collector.record({
      suite,
      category,
      name: "SECURITY - Compiler API treats script tags strictly as inert string data",
      language: lang,
      status: isProperlyPassedAsRawText ? "PASS" : "FAIL",
      expected: "Raw string preserved without server execution",
      actual: res.data?.output?.trim(),
      durationMs: Date.now() - t0,
    });
  }

  // 6. Host Kernel / Network Boundary Audit (Explicitly Reported as UNVERIFIED if without containerization)
  {
    const category = "Host Kernel Boundary Audit";
    collector.record({
      suite,
      category,
      name: "SECURITY - Kernel-level cgroups / network namespace jail",
      language: "system",
      status: "UNVERIFIED",
      expected: "Containerized gVisor / Docker / nsjail isolation",
      actual: "Host OS process execution (Windows environment without Docker daemon containerization)",
      details:
        "The current host environment executes compilers via Windows subprocesses with wall-clock timeout and process-tree termination. Full kernel cgroup network/filesystem sandbox requires Docker or a Linux container runtime.",
    });
  }
}

module.exports = {
  runSandboxSecurityTests,
};
