import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPointTaskKey,
  normalizePointTaskInput,
  resolvePointTaskClaimDecision,
  toUserPointTask,
  validatePointTaskUrl,
} from "../../server/services/points/pointTasks.mjs";

test("normalizePointTaskInput sanitizes configurable task fields", () => {
  const task = normalizePointTaskInput({
    title: "  阅读网易爆米花推广文章  ",
    description: "  阅读文章后领取积分  ",
    url: "https://www.aipan.me/blog/post",
    points: "100",
    enabled: false,
    sortOrder: "10",
    claimLimit: "1",
  }, {
    existingKey: "netease-popcorn-blog-2026-05",
  });

  assert.deepEqual(task, {
    key: "netease-popcorn-blog-2026-05",
    title: "阅读网易爆米花推广文章",
    description: "阅读文章后领取积分",
    url: "https://www.aipan.me/blog/post",
    points: 100,
    enabled: false,
    sortOrder: 10,
    claimLimit: 1,
  });
});

test("buildPointTaskKey creates stable URL-safe keys", () => {
  assert.equal(
    buildPointTaskKey({
      title: "Read NetEase Popcorn",
      seed: 1714896000000,
    }),
    "read-netease-popcorn-lvt8su80",
  );
});

test("validatePointTaskUrl rejects non-http URLs", () => {
  assert.throws(() => validatePointTaskUrl("javascript:alert(1)"), /http/);
  assert.equal(validatePointTaskUrl("https://example.com/a"), "https://example.com/a");
});

test("resolvePointTaskClaimDecision allows claims below the task limit", () => {
  const decision = resolvePointTaskClaimDecision({
    task: {
      enabled: true,
      claimLimit: 2,
    },
    completedCount: 1,
  });

  assert.equal(decision.claimable, true);
  assert.equal(decision.claimNo, 2);
  assert.equal(decision.remainingClaims, 1);
});

test("resolvePointTaskClaimDecision blocks disabled and completed tasks", () => {
  assert.deepEqual(resolvePointTaskClaimDecision({
    task: {
      enabled: false,
      claimLimit: 1,
    },
    completedCount: 0,
  }), {
    claimable: false,
    reason: "disabled",
    message: "任务已关闭",
  });

  assert.deepEqual(resolvePointTaskClaimDecision({
    task: {
      enabled: true,
      claimLimit: 1,
    },
    completedCount: 1,
  }), {
    claimable: false,
    reason: "already_claimed",
    message: "该任务奖励已领取",
  });
});

test("toUserPointTask exposes claim state without leaking admin fields", () => {
  const task = toUserPointTask({
    task: {
      id: 1,
      key: "promo",
      title: "推广任务",
      description: "",
      url: "https://example.com",
      points: 100,
      enabled: true,
      sortOrder: 10,
      claimLimit: 1,
    },
    completedCount: 1,
  });

  assert.equal(task.status, "completed");
  assert.equal(task.canClaim, false);
  assert.equal(task.completedCount, 1);
});
