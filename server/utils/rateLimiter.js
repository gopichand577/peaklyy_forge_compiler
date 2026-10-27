/**
 * Peaklyy Forge - Rate Limiting Middleware
 * 
 * Protects execution and judge endpoints from request flooding and denial of service.
 */

const requestCounts = new Map();
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_MIN = parseInt(process.env.EXECUTION_RATE_LIMIT, 10) || (process.env.NODE_ENV === "test" ? 2000 : 40);

/**
 * Sweeps stale IP buckets.
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, 30000);

function resetRateLimiter() {
  requestCounts.clear();
}

function executionRateLimiter(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();

  let record = requestCounts.get(ip);
  if (!record || now - record.windowStart > WINDOW_MS) {
    record = { windowStart: now, count: 0 };
    requestCounts.set(ip, record);
  }

  record.count++;

  if (record.count > MAX_REQUESTS_PER_MIN) {
    return res.status(429).json({
      success: false,
      status: "RATE_LIMIT_EXCEEDED",
      error: `Execution rate limit exceeded (maximum ${MAX_REQUESTS_PER_MIN} runs per minute). Please wait a moment before trying again.`,
    });
  }

  next();
}

module.exports = {
  executionRateLimiter,
  resetRateLimiter,
};
