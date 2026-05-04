const DEFAULT_QUEUE_PREFIX = "aipan:user-resource-auto-review";
const DEFAULT_QUEUE_NAME = "jobs";
const SAFE_JOB_OPTION_KEYS = new Set([
  "notifyUser",
  "emailEnabled",
  "approveValid",
  "rejectInvalid",
  "requireReachable",
  "maxLinks",
  "timeoutMs",
]);

const memoryState = {
  queue: [],
  queuedIds: new Set(),
  active: 0,
  started: false,
  processor: null,
  options: null,
  timer: null,
};

let redisLoggedUnavailable = false;

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseIntOption = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const normalizeQueueMode = (value) => {
  const mode = String(value || "auto").trim().toLowerCase();
  return ["auto", "redis", "memory"].includes(mode) ? mode : "auto";
};

const sanitizeJobOptions = (options = {}) =>
  Object.fromEntries(
    Object.entries(options).filter(([key, value]) => {
      return SAFE_JOB_OPTION_KEYS.has(key) && value !== undefined;
    })
  );

const getRedisQueueKeys = (options) => {
  const prefix = options.queuePrefix || DEFAULT_QUEUE_PREFIX;
  const queueName = options.queueName || DEFAULT_QUEUE_NAME;

  return {
    listKey: `${prefix}:${queueName}`,
    dedupeKey: (resourceId) => `${prefix}:dedupe:${resourceId}`,
  };
};

const logRedisUnavailable = (error) => {
  if (redisLoggedUnavailable) {
    return;
  }

  redisLoggedUnavailable = true;
  console.warn("用户资源自动审核 Redis 队列不可用，降级为进程内队列:", error);
};

async function getRedisClient() {
  const redisModule = await import("~/server/utils/redis");
  return redisModule.getRedisClient();
}

async function enqueueInRedis(job, options) {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  const keys = getRedisQueueKeys(options);
  const dedupeResult = await client.set(keys.dedupeKey(job.resourceId), "1", {
    NX: true,
    EX: options.dedupeTtlSeconds,
  });

  if (dedupeResult !== "OK") {
    return {
      queued: false,
      duplicate: true,
      backend: "redis",
      resourceId: job.resourceId,
      jobId: job.id,
    };
  }

  await client.rPush(keys.listKey, JSON.stringify(job));

  return {
    queued: true,
    duplicate: false,
    backend: "redis",
    resourceId: job.resourceId,
    jobId: job.id,
  };
}

function enqueueInMemory(job) {
  if (memoryState.queuedIds.has(job.resourceId)) {
    return {
      queued: false,
      duplicate: true,
      backend: "memory",
      resourceId: job.resourceId,
      jobId: job.id,
    };
  }

  memoryState.queuedIds.add(job.resourceId);
  memoryState.queue.push(job);
  drainMemoryQueue();

  return {
    queued: true,
    duplicate: false,
    backend: "memory",
    resourceId: job.resourceId,
    jobId: job.id,
  };
}

function scheduleMemoryDrain(delayMs = 0) {
  if (!memoryState.processor || !memoryState.started) {
    return;
  }

  if (memoryState.timer) {
    return;
  }

  memoryState.timer = setTimeout(() => {
    memoryState.timer = null;
    drainMemoryQueue();
  }, delayMs);
}

function retryMemoryJob(job, options) {
  const retryJob = {
    ...job,
    attempt: job.attempt + 1,
    enqueuedAt: new Date().toISOString(),
  };

  setTimeout(() => {
    memoryState.queue.push(retryJob);
    scheduleMemoryDrain();
  }, options.retryDelayMs);
}

function releaseMemoryJob(job) {
  memoryState.queuedIds.delete(job.resourceId);
}

function drainMemoryQueue() {
  if (!memoryState.processor || !memoryState.started) {
    return;
  }

  const options = memoryState.options || getUserResourceAutoReviewQueueOptions();

  while (
    memoryState.active < options.workerConcurrency &&
    memoryState.queue.length > 0
  ) {
    const job = memoryState.queue.shift();
    memoryState.active += 1;

    Promise.resolve(memoryState.processor(job))
      .then((result) => {
        if (result?.action === "failed" && job.attempt < options.maxRetries) {
          retryMemoryJob(job, options);
          return;
        }

        releaseMemoryJob(job);
      })
      .catch((error) => {
        console.error("用户资源自动审核内存队列任务失败:", {
          job,
          error,
        });

        if (job.attempt < options.maxRetries) {
          retryMemoryJob(job, options);
          return;
        }

        releaseMemoryJob(job);
      })
      .finally(() => {
        memoryState.active -= 1;
        scheduleMemoryDrain();
      });
  }
}

async function popRedisJob(options) {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  const keys = getRedisQueueKeys(options);
  const rawJob = await client.lPop(keys.listKey);
  if (!rawJob) {
    return null;
  }

  try {
    return JSON.parse(rawJob);
  } catch (error) {
    console.error("用户资源自动审核队列任务 JSON 解析失败:", {
      rawJob,
      error,
    });
    return null;
  }
}

async function releaseRedisJob(job, options) {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  const keys = getRedisQueueKeys(options);
  await client.del(keys.dedupeKey(job.resourceId));
}

async function retryRedisJob(job, options) {
  const retryJob = {
    ...job,
    attempt: job.attempt + 1,
    enqueuedAt: new Date().toISOString(),
  };

  setTimeout(async () => {
    try {
      const client = await getRedisClient();
      if (!client) {
        return;
      }

      const keys = getRedisQueueKeys(options);
      await client.rPush(keys.listKey, JSON.stringify(retryJob));
    } catch (error) {
      console.error("用户资源自动审核 Redis 队列重试入队失败:", {
        job: retryJob,
        error,
      });
    }
  }, options.retryDelayMs);
}

function startRedisWorker(processor, options) {
  const state = {
    active: 0,
    polling: false,
    stopped: false,
  };

  const tick = async () => {
    if (state.stopped || state.polling) {
      return;
    }

    state.polling = true;

    try {
      while (state.active < options.workerConcurrency) {
        const job = await popRedisJob(options);
        if (!job) {
          break;
        }

        state.active += 1;
        Promise.resolve(processor(job))
          .then(async (result) => {
            if (result?.action === "failed" && job.attempt < options.maxRetries) {
              await retryRedisJob(job, options);
              return;
            }

            await releaseRedisJob(job, options);
          })
          .catch(async (error) => {
            console.error("用户资源自动审核 Redis 队列任务失败:", {
              job,
              error,
            });

            if (job.attempt < options.maxRetries) {
              await retryRedisJob(job, options);
              return;
            }

            await releaseRedisJob(job, options);
          })
          .finally(() => {
            state.active -= 1;
          });
      }
    } catch (error) {
      logRedisUnavailable(error);
    } finally {
      state.polling = false;
      if (!state.stopped) {
        setTimeout(tick, options.pollIntervalMs);
      }
    }
  };

  tick();

  return () => {
    state.stopped = true;
  };
}

export function getUserResourceAutoReviewQueueOptions(env = process.env) {
  return {
    enabled: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED, true),
    mode: normalizeQueueMode(env.USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE),
    workerEnabled: parseBoolean(
      env.USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED,
      true
    ),
    workerConcurrency: parseIntOption(
      env.USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY,
      2,
      1,
      10
    ),
    pollIntervalMs: parseIntOption(
      env.USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS,
      2000,
      250,
      60000
    ),
    maxRetries: parseIntOption(
      env.USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES,
      3,
      0,
      10
    ),
    retryDelayMs: parseIntOption(
      env.USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS,
      30000,
      250,
      3600000
    ),
    dedupeTtlSeconds: parseIntOption(
      env.USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS,
      3600,
      60,
      86400
    ),
    queuePrefix:
      String(env.USER_RESOURCE_AUTO_REVIEW_QUEUE_PREFIX || "").trim() ||
      DEFAULT_QUEUE_PREFIX,
    queueName:
      String(env.USER_RESOURCE_AUTO_REVIEW_QUEUE_NAME || "").trim() ||
      DEFAULT_QUEUE_NAME,
  };
}

export function buildUserResourceAutoReviewJob(
  resourceId,
  jobOptions = {},
  attempt = 0
) {
  const normalizedResourceId = Number.parseInt(String(resourceId || ""), 10);
  if (!Number.isInteger(normalizedResourceId) || normalizedResourceId <= 0) {
    throw new Error("资源ID无效");
  }

  return {
    id: `user-resource-${normalizedResourceId}`,
    resourceId: normalizedResourceId,
    options: sanitizeJobOptions(jobOptions),
    attempt: Math.max(Number.parseInt(String(attempt || 0), 10) || 0, 0),
    enqueuedAt: new Date().toISOString(),
  };
}

export async function enqueueUserResourceAutoReview(
  resourceId,
  jobOptions = {},
  queueOptions = {}
) {
  const options = {
    ...getUserResourceAutoReviewQueueOptions(),
    ...queueOptions,
  };

  if (!options.enabled) {
    return {
      queued: false,
      disabled: true,
      resourceId: Number.parseInt(String(resourceId || ""), 10) || null,
    };
  }

  const job = buildUserResourceAutoReviewJob(resourceId, jobOptions);

  if (options.mode !== "memory") {
    try {
      const result = await enqueueInRedis(job, options);
      if (result) {
        return result;
      }
    } catch (error) {
      logRedisUnavailable(error);
      if (options.mode === "redis") {
        throw error;
      }
    }
  }

  return enqueueInMemory(job);
}

export function startUserResourceAutoReviewWorker(processor, queueOptions = {}) {
  const options = {
    ...getUserResourceAutoReviewQueueOptions(),
    ...queueOptions,
  };

  if (!options.enabled || !options.workerEnabled) {
    return false;
  }

  const wrappedProcessor = (job) =>
    processor(job.resourceId, {
      ...(job.options || {}),
      queueAttempt: job.attempt,
    });

  if (options.mode !== "memory") {
    startRedisWorker(wrappedProcessor, options);
  }

  memoryState.processor = wrappedProcessor;
  memoryState.options = options;
  memoryState.started = true;
  scheduleMemoryDrain();

  return true;
}

export async function getUserResourceAutoReviewQueueStats(
  queueOptions = {}
) {
  const options = {
    ...getUserResourceAutoReviewQueueOptions(),
    ...queueOptions,
  };
  let redisWaiting = null;

  if (options.mode !== "memory") {
    try {
      const client = await getRedisClient();
      if (client) {
        const keys = getRedisQueueKeys(options);
        redisWaiting = await client.lLen(keys.listKey);
      }
    } catch (error) {
      logRedisUnavailable(error);
    }
  }

  return {
    enabled: options.enabled,
    mode: options.mode,
    workerEnabled: options.workerEnabled,
    workerConcurrency: options.workerConcurrency,
    maxRetries: options.maxRetries,
    retryDelayMs: options.retryDelayMs,
    redisWaiting,
    memoryWaiting: memoryState.queue.length,
    memoryActive: memoryState.active,
  };
}
