import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_COMPILER_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

/**
 * P0 Compiler Execution
 * Sends source code and stdin to backend for compilation and execution.
 */
export const executeCode = async (language, code, input = "", options = {}) => {
  const response = await client.post(
    "/compiler/run",
    {
      language,
      code,
      input,
      stdin: input,
    },
    options
  );
  return response.data;
};

/**
 * Fetches configured languages and real runtime availability from the backend.
 */
export const fetchAvailableLanguages = async () => {
  try {
    const response = await client.get("/compiler/languages");
    return response.data?.languages || null;
  } catch (err) {
    console.warn("Failed to fetch language runtime availability:", err.message);
    return null;
  }
};
