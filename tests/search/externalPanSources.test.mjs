import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExternalPanSearchResult,
  getExternalPanSourceConfigs,
  parseDirectAnchorResults,
  parseEmbeddedQingfeiResults,
  parseFlarumApiResults,
  parsePanClubSearchResults,
  parseQingfeiApiResults,
  parseRemanApiResults,
  parseSequentialTitleLinkResults,
  parseSosoApiResults,
  parseSoxunleiApiResults,
} from "../../server/services/search/externalPanSources.mjs";

test("external pan sources avoid PanSou plugin duplicates", () => {
  const pansouPluginIds = new Set([
    "ahhhhfs",
    "duoduo",
    "hunhepan",
    "haisou",
    "jupansou",
    "panyq",
    "panlian",
    "pansearch",
    "panwiki",
    "quarksoo",
    "qupansou",
    "sousou",
    "susu",
    "wanou",
    "yunso",
    "yunsou",
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

test("parseDirectAnchorResults drops hash placeholder passwords from links", () => {
  const html = `
    <a href="https://pan.baidu.com/s/hashpwd?pwd=#">速度与激情</a>
  `;

  assert.deepEqual(parseDirectAnchorResults(html, "速度与激情"), [
    {
      name: "速度与激情",
      links: [{ service: "BAIDU", link: "https://pan.baidu.com/s/hashpwd" }],
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

test("parseQingfeiApiResults maps title-based qingfei api results", () => {
  const responseText = JSON.stringify({
    code: 200,
    data: {
      total_result: 2,
      items: [
        {
          title: "2 Fast 2 Furious 速度与激情2",
          code: "8888",
          url: "https://pan.quark.cn/s/qingfei",
        },
        {
          title: "热门推荐",
          url: "https://pan.quark.cn/s/hot",
        },
      ],
    },
  });

  assert.deepEqual(parseQingfeiApiResults(responseText, "速度与激情"), [
    {
      name: "2 Fast 2 Furious 速度与激情2",
      links: [
        {
          service: "QUARK",
          link: "https://pan.quark.cn/s/qingfei",
          pwd: "8888",
        },
      ],
    },
  ]);
});

test("parseEmbeddedQingfeiResults maps server-rendered qingfei lists", () => {
  const html = `
    <script>
      const listItemsData = [{"title":"速度与激情5","url":"https:\\/\\/pan.quark.cn\\/s\\/list-items","code":null}];
      function linkBtn(element) {
        const list = JSON.parse('[{"title":"速度与激情7","url":"https:\\/\\/pan.baidu.com\\/s\\/embedded?pwd=1212","code":""}]');
      }
    </script>
  `;

  assert.deepEqual(parseEmbeddedQingfeiResults(html, "速度与激情"), [
    {
      name: "速度与激情5",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/list-items" }],
    },
    {
      name: "速度与激情7",
      links: [
        {
          service: "BAIDU",
          link: "https://pan.baidu.com/s/embedded?pwd=1212",
          pwd: "1212",
        },
      ],
    },
  ]);
});

test("parseFlarumApiResults maps public discussion posts with cloud links", () => {
  const responseText = JSON.stringify({
    data: [
      {
        id: "1",
        attributes: { title: "速度与激情 4K 合集" },
        relationships: { firstPost: { data: { id: "101", type: "posts" } } },
      },
      {
        id: "2",
        attributes: { title: "热门推荐" },
        relationships: { firstPost: { data: { id: "102", type: "posts" } } },
      },
    ],
    included: [
      {
        id: "101",
        type: "posts",
        attributes: {
          contentHtml:
            '<p>夸克链接 <a href="https://pan.quark.cn/s/flarum">https://pan.quark.cn/s/flarum</a></p>',
        },
      },
      {
        id: "102",
        type: "posts",
        attributes: {
          contentHtml:
            '<p>热门 <a href="https://pan.quark.cn/s/hot">https://pan.quark.cn/s/hot</a></p>',
        },
      },
    ],
  });

  assert.deepEqual(parseFlarumApiResults(responseText, "速度与激情"), [
    {
      name: "速度与激情 4K 合集",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/flarum" }],
    },
  ]);
});

test("parseSosoApiResults maps public soso cloud links", () => {
  const responseText = JSON.stringify({
    results: [
      {
        fileTitle: "速度与激情 合集",
        filePath: "/电影/速度与激情 合集",
        fileLink: "https://pan.baidu.com/s/soso?pwd=#",
        fileCode: "#",
      },
      {
        fileTitle: "热门推荐",
        filePath: "/热门推荐",
        fileLink: "https://pan.xunlei.com/s/hot",
      },
    ],
  });

  assert.deepEqual(parseSosoApiResults(responseText, "速度与激情"), [
    {
      name: "速度与激情 合集",
      links: [{ service: "BAIDU", link: "https://pan.baidu.com/s/soso" }],
    },
  ]);
});

test("parseSoxunleiApiResults maps public xunlei share ids", () => {
  const responseText = JSON.stringify({
    code: 200,
    list: [
      {
        title: "Python 速度与激情 示例",
        filePath: "/Python/速度与激情 示例",
        shareId: "https://pan.xunlei.com/s/soxunlei",
      },
      {
        title: "热门推荐",
        filePath: "/热门推荐",
        shareId: "https://pan.xunlei.com/s/hot",
      },
    ],
  });

  assert.deepEqual(parseSoxunleiApiResults(responseText, "速度与激情"), [
    {
      name: "Python 速度与激情 示例",
      links: [{ service: "XUNLEI", link: "https://pan.xunlei.com/s/soxunlei" }],
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
    {
      id: "qingfei-api",
      label: "Qingfei API",
      type: "qingfeiApi",
      baseUrl: "https://example.test",
      searchUrl: () => "https://example.test/api/search",
      fetchText: async () =>
        JSON.stringify({
          code: 200,
          data: {
            items: [
              {
                title: "速度与激情 API",
                url: "https://pan.xunlei.com/s/api123",
              },
            ],
          },
        }),
    },
    {
      id: "qingfei-page",
      label: "Qingfei Page",
      type: "embeddedQingfei",
      searchUrl: () => "https://example.test/s/%E9%80%9F%E5%BA%A6",
      fetchText: async () =>
        '<script>const listItemsData = [{"title":"速度与激情 Page","url":"https:\\/\\/pan.quark.cn\\/s\\/page123"}];</script>',
    },
    {
      id: "flarum",
      label: "Flarum",
      type: "flarumApi",
      baseUrl: "https://example.test",
      searchUrl: () => "https://example.test/api/discussions",
      fetchText: async () =>
        JSON.stringify({
          data: [
            {
              id: "1",
              attributes: { title: "速度与激情 Forum" },
              relationships: { firstPost: { data: { id: "201", type: "posts" } } },
            },
          ],
          included: [
            {
              id: "201",
              type: "posts",
              attributes: {
                contentHtml: '<a href="https://pan.quark.cn/s/forum123">链接</a>',
              },
            },
          ],
        }),
    },
    {
      id: "soso",
      label: "SOSO",
      type: "sosoApi",
      baseUrl: "https://example.test",
      searchUrl: () => "https://example.test/list",
      fetchText: async () =>
        JSON.stringify({
          results: [
            {
              fileTitle: "速度与激情 SOSO",
              fileLink: "https://pan.xunlei.com/s/soso123",
            },
          ],
        }),
    },
    {
      id: "soxunlei",
      label: "SoXunlei",
      type: "soxunleiApi",
      baseUrl: "https://example.test",
      searchUrl: () => "https://example.test/search/list",
      fetchText: async () =>
        JSON.stringify({
          code: 200,
          list: [
            {
              title: "速度与激情 Xunlei",
              shareId: "https://pan.xunlei.com/s/soxunlei123",
            },
          ],
        }),
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
    {
      name: "速度与激情 API",
      links: [{ service: "XUNLEI", link: "https://pan.xunlei.com/s/api123" }],
    },
    {
      name: "速度与激情 Page",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/page123" }],
    },
    {
      name: "速度与激情 Forum",
      links: [{ service: "QUARK", link: "https://pan.quark.cn/s/forum123" }],
    },
    {
      name: "速度与激情 SOSO",
      links: [{ service: "XUNLEI", link: "https://pan.xunlei.com/s/soso123" }],
    },
    {
      name: "速度与激情 Xunlei",
      links: [{ service: "XUNLEI", link: "https://pan.xunlei.com/s/soxunlei123" }],
    },
  ]);
});
