import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserResourceIndexDocument,
  buildUserResourceSearchQuery,
} from "../../server/services/search/userResourceSearchIndex.js";

test("buildUserResourceIndexDocument maps published user resources into ES documents", () => {
  const doc = buildUserResourceIndexDocument({
    id: 42,
    name: "示例投稿",
    description: "示例描述",
    links: JSON.stringify([
      { value: "https://pan.baidu.com/s/abc", pwd: "1234" },
      { value: "https://pan.quark.cn/s/xyz" },
    ]),
    typeId: 7,
    type: { name: "电影" },
    creatorId: 9,
    creator: { username: "alice" },
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    updatedAt: new Date("2026-01-03T04:05:06.000Z"),
  });

  assert.deepEqual(doc, {
    resourceId: 42,
    name: "示例投稿",
    description: "示例描述",
    typeId: 7,
    typeName: "电影",
    creatorId: 9,
    creatorUsername: "alice",
    links: [
      { link: "https://pan.baidu.com/s/abc", pwd: "1234", service: "BAIDU" },
      { link: "https://pan.quark.cn/s/xyz", pwd: "", service: "QUARK" },
    ],
    createdAt: "2026-01-02T03:04:05.000Z",
    updatedAt: "2026-01-03T04:05:06.000Z",
  });
});

test("buildUserResourceSearchQuery uses the fixed weighted fields and ordering", () => {
  assert.deepEqual(buildUserResourceSearchQuery("资源", 25), {
    size: 25,
    sort: [{ _score: "desc" }, { updatedAt: "desc" }],
    query: {
      multi_match: {
        query: "资源",
        fields: ["name^5", "description^2", "typeName^2"],
      },
    },
  });
});
