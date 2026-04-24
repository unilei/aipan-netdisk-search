import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserResourceAdminListQuery,
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

test("buildUserResourceAdminListQuery supports paged ES browsing", () => {
  assert.deepEqual(
    buildUserResourceAdminListQuery({ page: 3, pageSize: 10 }),
    {
      from: 20,
      size: 10,
      track_total_hits: true,
      sort: [{ updatedAt: "desc" }],
      query: {
        match_all: {},
      },
    }
  );
});

test("buildUserResourceAdminListQuery searches the same indexed fields", () => {
  assert.deepEqual(
    buildUserResourceAdminListQuery({
      page: 1,
      pageSize: 250,
      search: "纪录片",
    }),
    {
      from: 0,
      size: 100,
      track_total_hits: true,
      sort: [{ _score: "desc" }, { updatedAt: "desc" }],
      query: {
        multi_match: {
          query: "纪录片",
          fields: ["name^5", "description^2", "typeName^2"],
        },
      },
    }
  );
});
