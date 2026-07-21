import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DOUBAN_HOMEPAGE_CACHE_KEY,
  DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
  countDoubanHomepageItems,
  hasUsableDoubanHomepageData,
  normalizeDoubanHomepageData,
} from "../../utils/doubanHomepage.mjs";

test("empty category shells are not usable Douban homepage data", () => {
  const emptySections = [
    { name: "豆瓣热映", data: [] },
    { name: "热门电视", data: [] },
  ];

  assert.deepEqual(normalizeDoubanHomepageData(emptySections), []);
  assert.equal(countDoubanHomepageItems(emptySections), 0);
  assert.equal(hasUsableDoubanHomepageData(emptySections), false);
});

test("normalization keeps usable movies and removes empty or malformed sections", () => {
  const normalized = normalizeDoubanHomepageData([
    {
      name: " 豆瓣热映 ",
      data: [
        { id: "1", title: "有效电影", cover: "https://example.com/1.jpg" },
        { id: "2", title: "" },
        null,
      ],
    },
    { name: "空分类", data: [] },
    { name: "无效分类", data: "not-an-array" },
  ]);

  assert.deepEqual(normalized, [
    {
      name: "豆瓣热映",
      data: [
        { id: "1", title: "有效电影", cover: "https://example.com/1.jpg" },
      ],
    },
  ]);
  assert.equal(countDoubanHomepageItems(normalized), 1);
  assert.equal(hasUsableDoubanHomepageData(normalized), true);
});

test("Douban API uses versioned primary and last-known-good caches", () => {
  const api = readFileSync(
    new URL("../../server/api/douban/new.ts", import.meta.url),
    "utf8",
  );

  assert.equal(DOUBAN_HOMEPAGE_CACHE_KEY, "douban_homepage_data_r2_v2");
  assert.equal(
    DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
    "douban_homepage_data_r2_last_good_v2",
  );
  assert.match(api, /hasUsableDoubanHomepageData\(freshData\)/);
  assert.match(api, /source: 'stale-cache'/);
  assert.match(api, /DOUBAN_UPSTREAM_TIMEOUT_MS/);
  assert.match(api, /setResponseStatus\(event, 502\)/);
});

test("Douban cache clearing is an administrator-only DELETE endpoint", () => {
  const adminCacheApi = readFileSync(
    new URL(
      "../../server/api/admin/cache/douban.delete.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(adminCacheApi, /requireAdmin\(event\)/);
  assert.match(adminCacheApi, /DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY/);
});
