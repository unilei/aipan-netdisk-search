import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserResourceAutoReviewJob,
  getUserResourceAutoReviewQueueOptions,
} from "../../server/services/userResources/autoReviewQueue.js";

test("getUserResourceAutoReviewQueueOptions clamps worker settings", () => {
  const options = getUserResourceAutoReviewQueueOptions({
    USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED: "true",
    USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE: "redis",
    USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED: "true",
    USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY: "99",
    USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES: "-1",
    USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS: "20",
  });

  assert.equal(options.enabled, true);
  assert.equal(options.mode, "redis");
  assert.equal(options.workerEnabled, true);
  assert.equal(options.workerConcurrency, 10);
  assert.equal(options.maxRetries, 0);
  assert.equal(options.retryDelayMs, 250);
});

test("buildUserResourceAutoReviewJob normalizes resource ids and job options", () => {
  const job = buildUserResourceAutoReviewJob("42", {
    notifyUser: true,
    emailEnabled: false,
  });

  assert.equal(job.resourceId, 42);
  assert.equal(job.id, "user-resource-42");
  assert.deepEqual(job.options, {
    notifyUser: true,
    emailEnabled: false,
  });
  assert.equal(job.attempt, 0);
});

test("buildUserResourceAutoReviewJob rejects invalid resource ids", () => {
  assert.throws(
    () => buildUserResourceAutoReviewJob("not-a-number"),
    /资源ID无效/
  );
});
