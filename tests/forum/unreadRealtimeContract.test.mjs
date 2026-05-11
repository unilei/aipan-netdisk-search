import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const schema = read("../../prisma/schema.prisma");
const replyApi = read("../../server/api/forum/topics/[slug]/reply.post.ts");
const topicsApi = read("../../server/api/forum/topics/index.get.ts");
const socketPlugin = read("../../server/plugins/socket.ts");
const notificationIcon = read("../../components/NotificationIcon.vue");
const forumIndex = read("../../pages/forum/index.vue");
const forumTopic = read("../../pages/forum/topic/[slug].vue");

test("forum unread read-state schema is modeled per user and topic", () => {
  assert.match(schema, /model ForumTopicReadState\s*\{/);
  assert.match(schema, /userId\s+Int/);
  assert.match(schema, /topicId\s+Int/);
  assert.match(schema, /unreadCount\s+Int\s+@default\(0\)/);
  assert.match(schema, /lastUnreadPostId\s+Int\?/);
  assert.match(schema, /@@unique\(\[userId,\s*topicId\]\)/);
});

test("forum unread APIs and migration files exist", () => {
  assert.equal(existsSync(new URL("../../server/api/forum/unread-summary.get.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../server/api/forum/unread/mark-all-read.post.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../../server/api/forum/topics/[slug]/read.post.ts", import.meta.url)), true);
  assert.equal(
    existsSync(new URL("../../prisma/migrations/20260511110000_add_forum_topic_read_states/migration.sql", import.meta.url)),
    true
  );
});

test("approved forum replies update unread state and emit realtime events", () => {
  assert.match(replyApi, /updateForumReadStatesForApprovedReply/);
  assert.match(replyApi, /forum:new_reply/);
  assert.match(replyApi, /notification:new/);
  assert.doesNotMatch(replyApi, /status !== 'approved'[\s\S]*forum:new_reply/);
});

test("forum topic list exposes viewerState only through optional auth", () => {
  assert.match(topicsApi, /getOptionalForumUser/);
  assert.match(topicsApi, /attachViewerStatesToTopics/);
  assert.match(topicsApi, /viewerState/);
});

test("socket users join a per-user room for multi-tab forum notifications", () => {
  assert.match(socketPlugin, /socket\.join\(`user:\$\{userId\}`\)/);
});

test("frontend consumes forum realtime events and keeps polling fallback", () => {
  assert.match(notificationIcon, /notification:new/);
  assert.match(notificationIcon, /setInterval\(\s*fetchUnreadCount,\s*60000\s*\)/);
  assert.match(forumIndex, /forum:new_reply/);
  assert.match(forumIndex, /mark-all-read/);
  assert.match(forumTopic, /forum:new_reply/);
  assert.match(forumTopic, /\/api\/forum\/topics\/\$\{slug\}\/read/);
});

test("forum read-state helper builds the fixed realtime payload shape", async () => {
  const {
    buildForumNewReplyPayload,
    uniqueForumParticipantIds,
  } = await import("../../server/services/forum/readStates.mjs");

  assert.deepEqual(uniqueForumParticipantIds({
    topicAuthorId: 1,
    postAuthorIds: [2, 2, 3, 4],
    actorId: 2,
  }), [1, 3, 4]);

  assert.deepEqual(buildForumNewReplyPayload({
    topic: { id: 10, slug: "hello", title: "Hello" },
    post: { id: 99 },
    readState: { unreadCount: 3, lastUnreadAt: new Date("2026-05-11T00:00:00.000Z") },
    authorUsername: "lei",
  }), {
    topicId: 10,
    slug: "hello",
    title: "Hello",
    postId: 99,
    unreadCount: 3,
    lastUnreadAt: "2026-05-11T00:00:00.000Z",
    authorUsername: "lei",
  });
});
