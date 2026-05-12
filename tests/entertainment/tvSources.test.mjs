import assert from "node:assert/strict";
import test from "node:test";

import { filterTvSources } from "../../server/services/tv/sources.mjs";

test("filterTvSources removes the 霍元甲 movie from live TV channels", () => {
  const sources = [
    { name: "CCTV-1", url: "https://live.example.test/cctv1.m3u8" },
    {
      name: "霍元甲.Fearless.2006",
      url: "https://alist.example.test/d/movie/fearless.mp4?sign=abc",
    },
    { name: "广东卫视", url: "https://live.example.test/gd.m3u8" },
  ];

  assert.deepEqual(filterTvSources(sources), [
    { name: "CCTV-1", url: "https://live.example.test/cctv1.m3u8" },
    { name: "广东卫视", url: "https://live.example.test/gd.m3u8" },
  ]);
});

test("filterTvSources ignores invalid rows and trims valid channel fields", () => {
  const sources = [
    null,
    { name: "   ", url: "https://live.example.test/blank.m3u8" },
    { name: " CCTV-13 ", url: " https://live.example.test/news.m3u8 " },
    { name: "No URL" },
  ];

  assert.deepEqual(filterTvSources(sources), [
    { name: "CCTV-13", url: "https://live.example.test/news.m3u8" },
  ]);
});
