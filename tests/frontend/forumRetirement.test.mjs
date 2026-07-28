import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const rootFile = (path) => new URL(`../../${path}`, import.meta.url);
const read = (path) => readFileSync(rootFile(path), "utf8");

test("forum pages and API entry points are retired", () => {
  const retiredFiles = [
    "pages/forum/index.vue",
    "pages/forum/create.vue",
    "pages/user/forum/index.vue",
    "pages/admin/forum/topics.vue",
    "server/api/forum/topics/index.get.ts",
    "server/api/user/forum/topics/index.get.ts",
    "server/api/admin/forum/topics/index.get.ts",
  ];

  for (const file of retiredFiles) {
    assert.equal(existsSync(rootFile(file)), false, `${file} should stay retired`);
  }
});

test("runtime navigation and sitemap no longer expose forum routes", () => {
  for (const file of [
    "utils/publicNavigation.ts",
    "server/api/__sitemap__/urls.ts",
    "layouts/admin.vue",
    "pages/chat/index.vue",
  ]) {
    assert.doesNotMatch(read(file), /\/forum(?:\/|["'])/);
  }
});

test("retired navigation migration removes persisted forum links", () => {
  const migration = read(
    "prisma/migrations/20260728090000_remove_retired_navigation_items/migration.sql",
  );

  assert.match(migration, /'\/forum'/);
  assert.match(migration, /LIKE '\/forum\/%'/);
});
