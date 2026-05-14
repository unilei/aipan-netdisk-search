import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("forum topic trash fields and admin endpoints exist", () => {
  const schema = read("../../prisma/schema.prisma");

  assert.match(schema, /statusBeforeTrash\s+String\?/);
  assert.match(schema, /trashedAt\s+DateTime\?/);
  assert.match(schema, /trashedById\s+Int\?/);
  assert.match(schema, /trashReason\s+String\?/);
  assert.match(schema, /@@index\(\[status,\s*trashedAt\]\)/);

  assert.equal(
    existsSync(new URL("../../server/api/admin/forum/topics/[id]/trash.post.ts", import.meta.url)),
    true,
  );
  assert.equal(
    existsSync(new URL("../../server/api/admin/forum/topics/[id]/restore.post.ts", import.meta.url)),
    true,
  );
});

test("forum trash service builds reversible status updates", async () => {
  const {
    FORUM_TOPIC_PUBLIC_STATUS,
    FORUM_TOPIC_TRASHED_STATUS,
    buildForumTopicTrashUpdate,
    buildForumTopicRestoreUpdate,
    isForumTopicPubliclyVisible,
  } = await import("../../server/services/forum/topicTrash.mjs");

  const now = new Date("2026-05-14T08:00:00.000Z");
  const topic = { id: 9, status: FORUM_TOPIC_PUBLIC_STATUS };

  assert.equal(FORUM_TOPIC_TRASHED_STATUS, "trashed");
  assert.equal(isForumTopicPubliclyVisible(topic), true);
  assert.equal(isForumTopicPubliclyVisible({ ...topic, status: FORUM_TOPIC_TRASHED_STATUS }), false);

  assert.deepEqual(
    buildForumTopicTrashUpdate({
      topic,
      actorId: 12,
      reason: "重复求码帖",
      now,
    }),
    {
      status: FORUM_TOPIC_TRASHED_STATUS,
      statusBeforeTrash: FORUM_TOPIC_PUBLIC_STATUS,
      trashedAt: now,
      trashedById: 12,
      trashReason: "重复求码帖",
    },
  );

  assert.deepEqual(
    buildForumTopicRestoreUpdate({
      status: FORUM_TOPIC_TRASHED_STATUS,
      statusBeforeTrash: FORUM_TOPIC_PUBLIC_STATUS,
    }),
    {
      status: FORUM_TOPIC_PUBLIC_STATUS,
      statusBeforeTrash: null,
      trashedAt: null,
      trashedById: null,
      trashReason: null,
    },
  );
});

test("public forum endpoints do not expose or mutate trashed topics", () => {
  const topicsIndex = read("../../server/api/forum/topics/index.get.ts");
  const topicDetail = read("../../server/api/forum/topics/[slug].get.ts");
  const topicReply = read("../../server/api/forum/topics/[slug]/reply.post.ts");
  const topicView = read("../../server/api/forum/topics/[slug]/view.get.ts");
  const topicRead = read("../../server/api/forum/topics/[slug]/read.post.ts");
  const forumPage = read("../../pages/forum/topic/[slug].vue");
  const adminTopicsPage = read("../../pages/admin/forum/topics.vue");

  assert.match(topicsIndex, /FORUM_TOPIC_PUBLIC_STATUS/);
  assert.match(topicDetail, /FORUM_TOPIC_PUBLIC_STATUS/);
  assert.match(topicReply, /FORUM_TOPIC_PUBLIC_STATUS/);
  assert.match(topicView, /FORUM_TOPIC_PUBLIC_STATUS/);
  assert.match(topicRead, /FORUM_TOPIC_PUBLIC_STATUS/);

  assert.match(forumPage, /移入回收站/);
  assert.match(forumPage, /trashTopic/);
  assert.match(adminTopicsPage, /回收站/);
  assert.match(adminTopicsPage, /恢复/);
  assert.match(adminTopicsPage, /永久删除/);
});
