import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import test from "node:test";

import {
  createApp,
  defineEventHandler,
  fetchWithEvent,
  getRequestPath,
  toNodeListener,
} from "h3";
import { createFetch } from "ofetch";

import { fetchDataSource } from "../../node_modules/@nuxtjs/sitemap/dist/runtime/nitro/sitemap/urlset/sources.js";

const socketMiddlewareSource = readFileSync(
  new URL("../../server/middleware/socket-io.ts", import.meta.url),
  "utf8",
);

test("Socket.IO middleware reads only the request path", () => {
  assert.match(socketMiddlewareSource, /getRequestPath\(event\)/);
  assert.doesNotMatch(socketMiddlewareSource, /getRequestURL\(event\)/);
});

test("a single-host child sitemap request reaches its dynamic source", async (t) => {
  const dynamicPath = "/blog/runtime-sitemap-host-regression";
  const app = createApp();
  let origin = "";
  let sourceHits = 0;

  const localDollarFetch = createFetch({
    fetch(input, init) {
      const target =
        typeof input === "string" && input.startsWith("/")
          ? `${origin}${input}`
          : input;
      return globalThis.fetch(target, init);
    },
    Headers,
  });

  app.use(
    defineEventHandler((event) => {
      event.$fetch = (request, init) =>
        fetchWithEvent(event, request, init, { fetch: localDollarFetch });
    }),
  );

  // Exercise the path-only behavior from server/middleware/socket-io.ts.
  app.use(
    defineEventHandler((event) => {
      const requestPath = getRequestPath(event);
      if (
        requestPath.startsWith("/api/socket.io") ||
        event.node.req.headers.upgrade === "websocket"
      ) {
        return;
      }
    }),
  );

  app.use(
    "/api/__sitemap__/urls",
    defineEventHandler(() => {
      sourceHits += 1;
      return [{ loc: dynamicPath }];
    }),
  );

  app.use(
    "/__sitemap__/zh-CN.xml",
    defineEventHandler(async (event) => {
      const source = await fetchDataSource(
        { fetch: "/api/__sitemap__/urls" },
        event,
      );
      const urls = source.urls
        .map(({ loc }) => `<url><loc>https://www.aipan.me${loc}</loc></url>`)
        .join("");
      return `<urlset>${urls}</urlset>`;
    }),
  );

  const server = createServer(toNodeListener(app));
  t.after(async () => {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  origin = `http://127.0.0.1:${address.port}`;

  const response = await fetch(`${origin}/__sitemap__/zh-CN.xml`, {
    headers: { Host: "www.aipan.me" },
  });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(sourceHits, 1);
  assert.match(body, new RegExp(dynamicPath));
});
