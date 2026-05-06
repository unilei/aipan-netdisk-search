import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminCommentWhere,
  normalizeAdminCommentListQuery,
  toAdminCommentListItem,
} from "../../server/services/blog/adminComments.mjs";

test("normalizeAdminCommentListQuery clamps pagination and whitelists search type", () => {
  assert.deepEqual(
    normalizeAdminCommentListQuery({
      page: "-5",
      pageSize: "500",
      keyword: "  匿名  ",
      searchType: "deleteToken",
    }),
    {
      page: 1,
      pageSize: 100,
      keyword: "匿名",
      searchType: "content",
    },
  );
});

test("buildAdminCommentWhere maps supported search fields", () => {
  assert.deepEqual(buildAdminCommentWhere({ keyword: "", searchType: "content" }), {});
  assert.deepEqual(
    buildAdminCommentWhere({ keyword: "aipan", searchType: "email" }),
    { email: { contains: "aipan" } },
  );
});

test("toAdminCommentListItem does not expose delete tokens", () => {
  const item = toAdminCommentListItem({
    id: 1,
    content: "hello",
    author: "Lei",
    email: "lei@example.com",
    website: "",
    avatar: "",
    createdAt: new Date("2026-05-06T00:00:00Z"),
    updatedAt: new Date("2026-05-06T00:00:00Z"),
    postId: 10,
    parentId: null,
    likes: 0,
    deleteToken: "secret-token",
    post: {
      id: 10,
      title: "Post title",
      slug: "post-title",
    },
  });

  assert.equal(item.id, 1);
  assert.equal(item.postTitle, "Post title");
  assert.equal(item.deleteToken, undefined);
});
