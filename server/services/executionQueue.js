/**
 * Peaklyy Forge - Compiler Concurrency Limiter & Fair Execution Queue
 * 
 * Provides safe bounded execution capacity under high concurrent load:
 * - Bounded simultaneous compiler executions (matched to CPU capabilities)
 * - Bounded pending queue with explicit backpressure (QUEUE_FULL / HTTP 503)
 * - Deficit / Round-Robin Fair Queuing per client (prevents one user from starving others)
 * - Queue wait-time tracking per execution
 * - Queue wait timeout protection (QUEUE_TIMEOUT / HTTP 504)
 * - Client cancellation support
 * - Real-time queue metrics and telemetry
 */

const os = require("os");

const DEFAULT_MAX_CONCURRENT = Math.max(2, Math.min(os.cpus().length || 4, 12));
const DEFAULT_MAX_QUEUE = 200;
const DEFAULT_QUEUE_TIMEOUT = 60000; // 60 seconds max queue wait

class ExecutionQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || parseInt(process.env.MAX_CONCURRENT_COMPILERS, 10) || DEFAULT_MAX_CONCURRENT;
    this.maxQueueSize = options.maxQueueSize || parseInt(process.env.MAX_QUEUE_SIZE, 10) || DEFAULT_MAX_QUEUE;
    this.queueTimeoutMs = options.queueTimeoutMs || parseInt(process.env.QUEUE_TIMEOUT_MS, 10) || DEFAULT_QUEUE_TIMEOUT;

    this.activeWorkers = 0;
    this.queuedCount = 0;

    /** @type {Map<string, Array<object>>} */
    this.clientQueues = new Map();
    /** @type {string[]} */
    this.clientKeys = [];
    this.roundRobinIndex = 0;

    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      completedExecutions: 0,
      queueFullRejections: 0,
      queueTimeouts: 0,
      totalExecutionTimeMs: 0,
      totalQueueWaitTimeMs: 0,
      recentExecutionTimes: [],
      recentQueueWaitTimes: [],
    };
  }

  /**
   * Enqueues an execution task.
   * @param {function(number): Promise<any>} taskFn - Worker task receiving queueWaitTime
   * @param {object} [options]
   * @param {string} [options.clientKey="default"] - Client identifier for fair scheduling
   * @param {number} [options.timeoutMs] - Optional custom queue timeout
   * @returns {Promise<any>}
   */
  enqueue(taskFn, options = {}) {
    this.metrics.totalRequests++;
    const clientKey = String(options.clientKey || "default").trim();
    const enqueuedAt = Date.now();

    // Check backpressure limit
    if (this.queuedCount >= this.maxQueueSize) {
      this.metrics.queueFullRejections++;
      const err = new Error("Execution queue is currently at maximum capacity. Please retry in a few moments.");
      err.code = "QUEUE_FULL";
      err.status = 503;
      err.retryAfter = 2;
      return Promise.reject(err);
    }

    // If an execution slot is immediately available and no others are queued, run immediately
    if (this.activeWorkers < this.maxConcurrent && this.queuedCount === 0) {
      this.activeWorkers++;
      return this._executeTask(taskFn, 0);
    }

    // Otherwise, enqueue with fair scheduling
    return new Promise((resolve, reject) => {
      let isSettled = false;
      let timer = null;
      const jobItem = {
        id: Math.random().toString(36).slice(2),
        clientKey,
        taskFn,
        enqueuedAt,
        resolve: (val) => {
          if (!isSettled) {
            isSettled = true;
            if (timer) clearTimeout(timer);
            resolve(val);
          }
        },
        reject: (err) => {
          if (!isSettled) {
            isSettled = true;
            if (timer) clearTimeout(timer);
            reject(err);
          }
        },
        cancelled: false,
      };

      // Support client disconnection abort
      if (options.signal) {
        if (options.signal.aborted) {
          const err = new Error("Execution request was aborted by client.");
          err.code = "CLIENT_ABORTED";
          err.status = 499;
          return reject(err);
        }
        options.signal.addEventListener("abort", () => {
          if (!isSettled) {
            jobItem.cancelled = true;
            this._removeFromClientQueue(clientKey, jobItem);
            const err = new Error("Execution request was aborted by client.");
            err.code = "CLIENT_ABORTED";
            err.status = 499;
            jobItem.reject(err);
          }
        }, { once: true });
      }

      const timeoutMs = options.timeoutMs || this.queueTimeoutMs;
      timer = setTimeout(() => {
        if (!isSettled) {
          jobItem.cancelled = true;
          this._removeFromClientQueue(clientKey, jobItem);
          this.metrics.queueTimeouts++;
          const err = new Error("Execution request timed out while waiting in queue.");
          err.code = "QUEUE_TIMEOUT";
          err.status = 504;
          jobItem.reject(err);
        }
      }, timeoutMs);

      // Add to fair client queue
      if (!this.clientQueues.has(clientKey)) {
        this.clientQueues.set(clientKey, []);
        this.clientKeys.push(clientKey);
      }
      this.clientQueues.get(clientKey).push(jobItem);
      this.queuedCount++;

      // Trigger dispatch check in case a slot just freed
      this._dispatchNext();
    });
  }

  /**
   * Executes a task function and handles cleanup / slot freeing.
   * @private
   */
  async _executeTask(taskFn, queueWaitTime) {
    const execStart = Date.now();
    try {
      const result = await taskFn(queueWaitTime);
      const executionDuration = Date.now() - execStart;

      this.metrics.completedExecutions++;
      this.metrics.totalExecutionTimeMs += executionDuration;
      this.metrics.totalQueueWaitTimeMs += queueWaitTime;

      // Keep sample window of 500 for quantile stats
      this.metrics.recentExecutionTimes.push(executionDuration);
      if (this.metrics.recentExecutionTimes.length > 500) this.metrics.recentExecutionTimes.shift();

      this.metrics.recentQueueWaitTimes.push(queueWaitTime);
      if (this.metrics.recentQueueWaitTimes.length > 500) this.metrics.recentQueueWaitTimes.shift();

      if (result && typeof result === "object") {
        result.queueWaitTime = queueWaitTime;
      }
      return result;
    } finally {
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      this._dispatchNext();
    }
  }

  /**
   * Fair round-robin dispatcher for queued execution jobs.
   * Dispatches as many queued jobs as there are available worker slots.
   * @private
   */
  _dispatchNext() {
    while (this.activeWorkers < this.maxConcurrent && this.queuedCount > 0) {
      const candidateItem = this._getNextCandidate();
      if (!candidateItem) break;
      if (candidateItem.cancelled) continue;

      this.activeWorkers++;
      const queueWaitTime = Date.now() - candidateItem.enqueuedAt;

      this._executeTask(candidateItem.taskFn, queueWaitTime)
        .then(candidateItem.resolve)
        .catch(candidateItem.reject);
    }
  }

  /**
   * Extracts the next candidate job in round-robin sequence across active client queues.
   * @private
   */
  _getNextCandidate() {
    if (this.clientKeys.length === 0) return null;

    let attempts = 0;
    const totalKeys = this.clientKeys.length;

    while (attempts < totalKeys && this.clientKeys.length > 0) {
      if (this.roundRobinIndex >= this.clientKeys.length) {
        this.roundRobinIndex = 0;
      }
      const key = this.clientKeys[this.roundRobinIndex];
      const queue = this.clientQueues.get(key);

      if (queue && queue.length > 0) {
        const item = queue.shift();
        this.queuedCount = Math.max(0, this.queuedCount - 1);

        if (queue.length === 0) {
          this.clientQueues.delete(key);
          this.clientKeys.splice(this.roundRobinIndex, 1);
        } else {
          this.roundRobinIndex = (this.roundRobinIndex + 1) % Math.max(1, this.clientKeys.length);
        }
        return item;
      } else {
        this.clientQueues.delete(key);
        this.clientKeys.splice(this.roundRobinIndex, 1);
      }
      attempts++;
    }
    return null;
  }

  /**
   * Removes an item from a specific client's queue.
   * @private
   */
  _removeFromClientQueue(clientKey, item) {
    const queue = this.clientQueues.get(clientKey);
    if (!queue) return;

    const idx = queue.indexOf(item);
    if (idx !== -1) {
      queue.splice(idx, 1);
      this.queuedCount = Math.max(0, this.queuedCount - 1);
    }

    if (queue.length === 0) {
      this.clientQueues.delete(clientKey);
      const keyIdx = this.clientKeys.indexOf(clientKey);
      if (keyIdx !== -1) {
        this.clientKeys.splice(keyIdx, 1);
      }
    }
  }

  /**
   * Returns current queue telemetry and execution stats.
   */
  getStats() {
    const avgExec = this.metrics.completedExecutions > 0
      ? Math.round(this.metrics.totalExecutionTimeMs / this.metrics.completedExecutions)
      : 0;
    const avgQueue = this.metrics.completedExecutions > 0
      ? Math.round(this.metrics.totalQueueWaitTimeMs / this.metrics.completedExecutions)
      : 0;

    return {
      activeWorkers: this.activeWorkers,
      maxConcurrent: this.maxConcurrent,
      queued: this.queuedCount,
      maxQueueSize: this.maxQueueSize,
      totalRequests: this.metrics.totalRequests,
      completedExecutions: this.metrics.completedExecutions,
      queueFullRejections: this.metrics.queueFullRejections,
      queueTimeouts: this.metrics.queueTimeouts,
      avgExecutionTimeMs: avgExec,
      avgQueueWaitTimeMs: avgQueue,
      activeClientCount: this.clientKeys.length,
    };
  }

  /**
   * Calculates percentiles for recent latencies.
   */
  getPercentiles() {
    const calc = (arr) => {
      if (!arr || arr.length === 0) return { p50: 0, p95: 0, p99: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
      return { p50, p95, p99 };
    };

    return {
      executionTime: calc(this.metrics.recentExecutionTimes),
      queueWaitTime: calc(this.metrics.recentQueueWaitTimes),
    };
  }

  /**
   * Resets metrics counters for fresh load testing runs.
   */
  resetMetrics() {
    this.metrics.totalRequests = 0;
    this.metrics.completedExecutions = 0;
    this.metrics.queueFullRejections = 0;
    this.metrics.queueTimeouts = 0;
    this.metrics.totalExecutionTimeMs = 0;
    this.metrics.totalQueueWaitTimeMs = 0;
    this.metrics.recentExecutionTimes = [];
    this.metrics.recentQueueWaitTimes = [];
  }
}

// Global singleton instance
const globalExecutionQueue = new ExecutionQueue();

module.exports = {
  ExecutionQueue,
  executionQueue: globalExecutionQueue,
};
