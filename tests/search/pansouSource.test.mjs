import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPansouSearchRequest,
  resolvePansouInstanceUrls,
  transformPansouResponses,
} from "../../server/services/search/pansouSource.mjs";

test("resolvePansouInstanceUrls uses configured URLs without appending public defaults", () => {
  const urls = resolvePansouInstanceUrls({
    pansouApiUrls:
      " http://host.docker.internal:8888/api/search, https://fallback.example/api/search ",
  });

  assert.deepEqual(urls, [
    "http://host.docker.internal:8888/api/search",
    "https://fallback.example/api/search",
  ]);
});

test("buildPansouSearchRequest sends a POST JSON request with configured search options", () => {
  const request = buildPansouSearchRequest(
    "http://host.docker.internal:8888/api/search",
    "速度与激情",
    {
      pansouCloudTypes: "quark,aliyun,baidu",
      pansouPlugins: "labi,duoduo",
      pansouSourceMode: "plugin",
      pansouRequestTimeoutMs: "9000",
      pansouAuthToken: "secret-token",
    },
  );

  assert.equal(request.url, "http://host.docker.internal:8888/api/search");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.timeout, 9000);
  assert.equal(request.options.headers.Authorization, "Bearer secret-token");
  assert.deepEqual(request.options.body, {
    kw: "速度与激情",
    refresh: false,
    res: "merge",
    src: "plugin",
    cloud_types: ["quark", "aliyun", "baidu"],
    plugins: ["labi", "duoduo"],
  });
});

test("transformPansouResponses keeps Guangya links and limits configured result count", () => {
  const result = transformPansouResponses(
    [
      {
        code: 0,
        message: "success",
        data: {
          merged_by_type: {
            guangya: [
              {
                url: "https://pan.guangya.cn/s/example",
                password: "1234",
                note: "速度与激情 光影资源",
                datetime: "2026-05-14T00:00:00Z",
              },
            ],
            quark: [
              {
                url: "https://pan.quark.cn/s/abc",
                password: "",
                note: "速度与激情 4K 合集",
                datetime: "2026-05-14T00:00:00Z",
              },
            ],
          },
        },
      },
    ],
    "速度与激情",
    { maxResults: 1 },
  );

  assert.equal(result.code, 200);
  assert.equal(result.list.length, 1);
  assert.equal(result.list[0].links[0].service, "GUANGYA");
});
