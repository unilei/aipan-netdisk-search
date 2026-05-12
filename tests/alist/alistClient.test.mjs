import assert from "node:assert/strict";
import test from "node:test";

import {
  createAlistClient,
  normalizeAlistBaseUrl,
  normalizeAlistPath,
  toPublicAlistSource,
} from "../../server/services/alist/client.mjs";

test("normalizeAlistBaseUrl and normalizeAlistPath produce stable AList paths", () => {
  assert.equal(normalizeAlistBaseUrl(" https://alist.example.test/// "), "https://alist.example.test");
  assert.equal(normalizeAlistPath("/电影/动作", "/media/"), "/media/电影/动作");
  assert.equal(normalizeAlistPath("", "/media"), "/media");
  assert.equal(normalizeAlistPath("/", "/"), "/");
  assert.throws(() => normalizeAlistPath("../secret", "/media"), /Invalid AList path/);
});

test("toPublicAlistSource does not expose stored secrets", () => {
  const source = toPublicAlistSource({
    id: 7,
    name: "Private AList",
    link: "https://alist.example.test",
    authMode: "password",
    username: "admin",
    secretEncrypted: "enc:v1:secret",
    rootPath: "/media",
    enabled: true,
    healthStatus: "ok",
    healthMessage: "ready",
    lastCheckedAt: new Date("2026-05-12T00:00:00.000Z"),
  });

  assert.deepEqual(source, {
    id: 7,
    name: "Private AList",
    link: "https://alist.example.test",
    authMode: "password",
    rootPath: "/media",
    enabled: true,
    hasCredential: true,
    healthStatus: "ok",
    healthMessage: "ready",
    lastCheckedAt: "2026-05-12T00:00:00.000Z",
  });
  assert.equal("username" in source, false);
  assert.equal("secretEncrypted" in source, false);
});

test("AList client logs in, lists files, and reuses Authorization token", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });

    if (url.endsWith("/api/auth/login")) {
      return { code: 200, data: { token: "token-from-login" } };
    }

    if (url.endsWith("/api/fs/list")) {
      assert.equal(options.headers.Authorization, "token-from-login");
      assert.deepEqual(JSON.parse(options.body), {
        path: "/media/movies",
        password: "",
        page: 2,
        per_page: 20,
        refresh: true,
      });
      return {
        code: 200,
        data: {
          content: [{ name: "movie.mp4", is_dir: false }],
          total: 1,
        },
      };
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const client = createAlistClient({ fetcher });
  const result = await client.list(
    {
      id: 1,
      link: "https://alist.example.test/",
      authMode: "password",
      username: "admin",
      secret: "password",
      rootPath: "/media",
    },
    { path: "/movies", page: 2, perPage: 20, refresh: true },
  );

  assert.equal(result.path, "/movies");
  assert.equal(result.fullPath, "/media/movies");
  assert.equal(result.page, 2);
  assert.equal(result.perPage, 20);
  assert.equal(result.hasMore, false);
  assert.deepEqual(result.content, [{ name: "movie.mp4", is_dir: false }]);
  assert.equal(calls.filter((call) => call.url.endsWith("/api/auth/login")).length, 1);
});

test("AList client retries once after an expired login token", async () => {
  const authorizations = [];
  const fetcher = async (url, options) => {
    if (url.endsWith("/api/auth/login")) {
      return { code: 200, data: { token: authorizations.length ? "fresh-token" : "expired-token" } };
    }

    if (url.endsWith("/api/fs/list")) {
      authorizations.push(options.headers.Authorization);
      if (options.headers.Authorization === "expired-token") {
        return { code: 401, message: "token expired" };
      }
      return { code: 200, data: { content: [], total: 0 } };
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const client = createAlistClient({ fetcher });
  await client.list({
    id: 3,
    link: "https://alist.example.test",
    authMode: "password",
    username: "admin",
    secret: "password",
  });

  assert.deepEqual(authorizations, ["expired-token", "fresh-token"]);
});

test("AList client falls back to cached listing when refresh is not permitted", async () => {
  const listPayloads = [];
  const fetcher = async (url, options) => {
    if (url.endsWith("/api/fs/list")) {
      const payload = JSON.parse(options.body);
      listPayloads.push(payload);
      if (payload.refresh) {
        return { code: 500, message: "Refresh without permission" };
      }
      return {
        code: 200,
        data: {
          content: [{ name: "cached-folder", is_dir: true }],
          total: 1,
        },
      };
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const client = createAlistClient({ fetcher });
  const result = await client.list(
    {
      id: 4,
      link: "https://alist.example.test",
      authMode: "public",
      rootPath: "/",
    },
    { path: "/", page: 1, perPage: 100, refresh: true },
  );

  assert.deepEqual(listPayloads.map((payload) => payload.refresh), [true, false]);
  assert.equal(result.refreshDenied, true);
  assert.deepEqual(result.content, [{ name: "cached-folder", is_dir: true }]);
});

test("AList client uses fs/get raw_url as the playback URL", async () => {
  const fetcher = async (url, options) => {
    if (url.endsWith("/api/fs/get")) {
      assert.deepEqual(JSON.parse(options.body), {
        path: "/video/demo.mp4",
        password: "1234",
      });
      return {
        code: 200,
        data: {
          name: "demo.mp4",
          raw_url: "https://cdn.example.test/demo.mp4",
          sign: "ignored",
        },
      };
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const client = createAlistClient({ fetcher });
  const result = await client.get(
    {
      id: 2,
      link: "https://alist.example.test",
      authMode: "public",
      rootPath: "/video",
    },
    { path: "demo.mp4", password: "1234" },
  );

  assert.equal(result.playUrl, "https://cdn.example.test/demo.mp4");
  assert.equal(result.fullPath, "/video/demo.mp4");
});

test("AList connection test checks auth, directory listing, and fs/get when a file exists", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, body: options?.body ? JSON.parse(options.body) : null });

    if (url.endsWith("/api/auth/login")) {
      return { code: 200, data: { token: "token-from-login" } };
    }

    if (url.endsWith("/api/fs/list")) {
      return {
        code: 200,
        data: {
          content: [{ name: "sample.mp4", is_dir: false }],
          total: 1,
        },
      };
    }

    if (url.endsWith("/api/fs/get")) {
      assert.deepEqual(JSON.parse(options.body), {
        path: "/sample.mp4",
        password: "",
      });
      return { code: 200, data: { raw_url: "https://cdn.example.test/sample.mp4" } };
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const client = createAlistClient({ fetcher });
  const result = await client.testConnection({
    id: 10,
    link: "https://alist.example.test",
    authMode: "password",
    username: "admin",
    secret: "password",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.checks.map((check) => check.name), ["auth", "list", "get"]);
  assert.deepEqual(calls.map((call) => call.url), [
    "https://alist.example.test/api/auth/login",
    "https://alist.example.test/api/fs/list",
    "https://alist.example.test/api/fs/get",
  ]);
});
