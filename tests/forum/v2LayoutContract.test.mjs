import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const forumPages = [
  ["forum home", "../../pages/forum/index.vue"],
  ["forum category", "../../pages/forum/category/[slug].vue"],
  ["forum topic detail", "../../pages/forum/topic/[slug].vue"],
  ["forum create", "../../pages/forum/create.vue"],
  ["user forum content", "../../pages/user/forum/index.vue"],
];

test("user-facing forum pages keep the forum layout with site-style surfaces", () => {
  for (const [label, path] of forumPages) {
    const source = read(path);

    assert.match(source, /bg-\[#f8fafc\]/, `${label} should use the shared site page background`);
    assert.match(source, /max-w-\[1100px\]/, `${label} should use the shared forum page width`);
    assert.match(source, /v2-box/, `${label} should render content in compact forum boxes`);
  }
});

test("forum topic detail uses V2-style topic and reply structure", () => {
  const topicPage = read("../../pages/forum/topic/[slug].vue");
  const postItem = read("../../components/ForumPostItem.vue");

  assert.match(topicPage, /v2-topic-header/, "topic detail should have a compact topic header");
  assert.match(topicPage, /主题统计/, "topic detail should keep a right-side stats panel");
  assert.match(postItem, /v2-reply-cell/, "reply component should render as a V2-style reply cell");
  assert.match(postItem, /content-type="post"/, "reply reporting should still target forum posts");
});
