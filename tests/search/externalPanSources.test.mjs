import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExternalPanSearchResult,
  getExternalPanSourceConfigs,
  parseDirectAnchorResults,
  parsePanClubSearchResults,
  parseRemanApiResults,
  parseSequentialTitleLinkResults,
} from "../../server/services/search/externalPanSources.mjs";

test("external pan sources avoid PanSou plugin duplicates", () => {
  const pansouPluginIds = new Set([
    "duoduo",
    "hunhepan",
    "haisou",
    "panyq",
    "yunso",
    "pan666",
  ]);

  const duplicated = getExternalPanSourceConfigs()
    .map((source) => source.id)
    .filter((id) => pansouPluginIds.has(id));

  assert.deepEqual(duplicated, []);
});

test("parseDirectAnchorResults keeps keyword-related real links only", () => {
  const html = `
    <div class="search-item"><a href="https://pan.quark.cn/s/ad">新人扩容</a></div>
    <div class="search-item"><a href="https://pan.quark.cn/s/abc123">速度与激情 4K 合集</a></div>
    <div class="search-item"><a href="https://www.aliyundrive.com/s/def456?pwd=8888">速度与激情 蓝光</a></div>
  `;

  assert.deepEqual(parseDirectAnchorResults(html, "速度与激情"), [
    {
      name: "速度与激情 4K 合集",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/abc123" }],
    },
    {
      name: "速度与激情 蓝光",
      links: [
        {
          service: "ALIYUN",
          link: "https://www.aliyundrive.com/s/def456?pwd=8888",
          pwd: "8888",
        },
      ],
    },
  ]);
});

test("parseDirectAnchorResults drops placeholder passwords from links", () => {
  const html = `
    <a href="https://pan.baidu.com/s/abc123?pwd=undefined">速度与激情</a>
  `;

  assert.deepEqual(parseDirectAnchorResults(html, "速度与激情"), [
    {
      name: "速度与激情",
      links: [{ service: "BAIDU", link: "https://pan.baidu.com/s/abc123" }],
    },
  ]);
});

test("parseSequentialTitleLinkResults pairs result titles with following links", () => {
  const html = `
    <a class="title" href="/s/example">速度与激情</a>
    <a class="label-wrap" href="https://pan.quark.cn/s/abc123"></a>
    <a class="top-item" href="/s/hot">热门推荐</a>
    <a class="label-wrap" href="https://pan.quark.cn/s/hot"></a>
  `;

  assert.deepEqual(parseSequentialTitleLinkResults(html, "速度与激情"), [
    {
      name: "速度与激情",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/abc123" }],
    },
  ]);
});

test("parsePanClubSearchResults extracts relevant detail pages", () => {
  const html = `
    <a href="/file/111/">速度与激情</a>
    <a href="/file/222/">无关推荐</a>
    <a href="/file/111/">查看详情</a>
  `;

  assert.deepEqual(
    parsePanClubSearchResults(html, "速度与激情", "https://pan.club"),
    [
      {
        name: "速度与激情",
        detailUrl: "https://pan.club/file/111/",
      },
    ],
  );
});

test("parseRemanApiResults maps public API disk results", () => {
  const responseText = JSON.stringify({
    code: 200,
    data: {
      list: [
        {
          disk_name: "<em>速度与激情</em>",
          disk_pass: "6666",
          disk_type: "BDY",
          files: "file:<em>速度与激情</em> 6.mkv",
          link: "https://pan.baidu.com/s/abc",
        },
        {
          disk_name: "热门推荐",
          files: "file:其他内容",
          link: "https://pan.quark.cn/s/hot",
        },
      ],
    },
  });

  assert.deepEqual(parseRemanApiResults(responseText, "速度与激情"), [
    {
      name: "速度与激情",
      links: [
        {
          service: "BAIDU",
          link: "https://pan.baidu.com/s/abc",
          pwd: "6666",
        },
      ],
    },
  ]);
});

test("buildExternalPanSearchResult groups links from multiple adapters", async () => {
  const result = await buildExternalPanSearchResult("速度与激情", [
    {
      id: "direct",
      label: "Direct",
      type: "directAnchors",
      searchUrl: () => "https://example.test/search",
      fetchText: async () =>
        '<a href="https://pan.quark.cn/s/abc123">速度与激情</a>',
    },
    {
      id: "panclub",
      label: "PanClub",
      type: "panClubDetail",
      baseUrl: "https://pan.club",
      searchUrl: () => "https://pan.club/s/0/0/1/%E9%80%9F%E5%BA%A6/",
      fetchText: async (url) =>
        url.includes("/file/")
          ? '<button onclick="window.open(\\\'https://pan.baidu.com/s/xyz?pwd=6666\\\')"></button>'
          : '<a href="/file/111/">速度与激情</a>',
    },
  ]);

  assert.equal(result.code, 200);
  assert.deepEqual(result.list, [
    {
      name: "速度与激情",
      links: [
        { service: "QUARK", link: "https://pan.quark.cn/s/abc123" },
        {
          service: "BAIDU",
          link: "https://pan.baidu.com/s/xyz?pwd=6666",
          pwd: "6666",
        },
      ],
    },
  ]);
});
