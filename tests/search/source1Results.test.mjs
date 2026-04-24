import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeSourceItems,
  normalizeLinks,
} from "../../server/services/search/source1Results.js";

test("normalizeLinks maps stored JSON links into source links", () => {
  const links = normalizeLinks(
    JSON.stringify([
      { value: "https://pan.baidu.com/s/abc", pwd: "1234" },
      { value: "https://pan.quark.cn/s/xyz" },
    ])
  );

  assert.deepEqual(links, [
    {
      link: "https://pan.baidu.com/s/abc",
      pwd: "1234",
      service: "BAIDU",
    },
    {
      link: "https://pan.quark.cn/s/xyz",
      pwd: "",
      service: "QUARK",
    },
  ]);
});

test("mergeSourceItems merges same-title results and de-duplicates links", () => {
  const localResults = [
    {
      name: "  资源合集   ",
      links: [
        { link: "https://pan.baidu.com/s/abc", pwd: "", service: "BAIDU" },
      ],
    },
  ];

  const esResults = [
    {
      name: "资源合集",
      links: [
        { link: "https://pan.baidu.com/s/abc", pwd: "", service: "BAIDU" },
        { link: "https://pan.quark.cn/s/xyz", pwd: "", service: "QUARK" },
      ],
    },
  ];

  assert.deepEqual(mergeSourceItems(localResults, esResults), [
    {
      name: "资源合集",
      links: [
        { link: "https://pan.baidu.com/s/abc", pwd: "", service: "BAIDU" },
        { link: "https://pan.quark.cn/s/xyz", pwd: "", service: "QUARK" },
      ],
    },
  ]);
});

test("mergeSourceItems keeps primary results ahead of secondary results", () => {
  const primary = [
    {
      name: "本地资源",
      links: [{ link: "https://pan.baidu.com/s/local", pwd: "", service: "BAIDU" }],
    },
  ];
  const secondary = [
    {
      name: "投稿资源",
      links: [{ link: "https://pan.quark.cn/s/remote", pwd: "", service: "QUARK" }],
    },
  ];

  assert.deepEqual(mergeSourceItems(primary, secondary), [
    {
      name: "本地资源",
      links: [{ link: "https://pan.baidu.com/s/local", pwd: "", service: "BAIDU" }],
    },
    {
      name: "投稿资源",
      links: [{ link: "https://pan.quark.cn/s/remote", pwd: "", service: "QUARK" }],
    },
  ]);
});
