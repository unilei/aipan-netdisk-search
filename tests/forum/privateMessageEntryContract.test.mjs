import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("private message dialog starts conversations through the dedicated API", () => {
  const dialog = read("components/chat/PrivateMessageStartDialog.vue");

  assert.match(dialog, /\/api\/chat\/private\/start/);
  assert.match(dialog, /privateMessageMinimumPoints/);
  assert.match(dialog, /10000/);
  assert.match(dialog, /不会扣除积分/);
  assert.match(dialog, /navigateTo\(\{\s*path:\s*["']\/chat["']/s);
});

test("forum reply items expose a private message action with recipient data", () => {
  const item = read("components/ForumPostItem.vue");

  assert.match(item, /private-message/);
  assert.match(item, /post\.author/);
  assert.match(item, /私信/);
});

test("forum topic page mounts the private message dialog for topic and reply authors", () => {
  const page = read("pages/forum/topic/[slug].vue");

  assert.match(page, /PrivateMessageStartDialog/);
  assert.match(page, /privateMessageTarget/);
  assert.match(page, /openPrivateMessage/);
  assert.match(page, /source-forum-topic-id/);
});

test("chat page supports inbox tabs and roomId auto selection", () => {
  const page = read("pages/chat/index.vue");

  assert.match(page, /route\.query\.roomId/);
  assert.match(page, /activeTab\s*=\s*ref\(["']private["']\)/);
  assert.match(page, /type=private/);
  assert.match(page, /unreadCount/);
  assert.match(page, /lastMessage/);
});
