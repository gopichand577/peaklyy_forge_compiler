/**
 * Peaklyy Forge - Live Compiler API Client
 * 
 * Interacts with the real backend running on http://localhost:5000.
 * Falls back to direct service execution if server is offline.
 */

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

async function executeCodeApi(language, code, input = "") {
  try {
    const res = await fetch(`${BASE_URL}/api/compiler/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        code,
        input,
        stdin: input,
      }),
    });

    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch (_e) {
      data = { rawText: await res.text() };
    }

    return {
      httpStatus: status,
      ok: res.ok,
      data,
    };
  } catch (err) {
    // If backend is not reached over HTTP, test through direct compilerService
    const { executeCode } = require("../../server/services/compilerService");
    const result = await executeCode(language, code, input);
    return {
      httpStatus: 200,
      ok: result.status === "SUCCESS",
      data: {
        success: result.status === "SUCCESS",
        ...result,
      },
    };
  }
}

async function getLanguagesApi() {
  try {
    const res = await fetch(`${BASE_URL}/api/compiler/languages`);
    const status = res.status;
    const data = await res.json();
    return {
      httpStatus: status,
      ok: res.ok,
      data,
    };
  } catch (_err) {
    const { getLanguageAvailability } = require("../../server/config/languages");
    return {
      httpStatus: 200,
      ok: true,
      data: {
        success: true,
        languages: getLanguageAvailability(),
      },
    };
  }
}

async function getHealthApi() {
  const res = await fetch(`${BASE_URL}/api/health`);
  return {
    httpStatus: res.status,
    ok: res.ok,
    data: await res.json(),
  };
}

module.exports = {
  executeCodeApi,
  getLanguagesApi,
  getHealthApi,
  BASE_URL,
};
