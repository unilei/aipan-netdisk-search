import { readFile } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const ROOT = process.cwd();

test("public navigation groups user-facing features without admin links", async () => {
  const content = await readFile(join(ROOT, "utils/publicNavigation.ts"), "utf8");

  assert.match(content, /key: "media"/);
  assert.match(content, /key: "community"/);
  assert.match(content, /key: "more"/);
  assert.match(content, /path: "\/tv"/);
  assert.match(content, /path: "\/alist"/);
  assert.match(content, /path: "\/tvbox"/);
  assert.doesNotMatch(content, /key: "search"/);
  assert.doesNotMatch(content, /\/admin/);
});

test("front-end headers consume the shared public navigation config", async () => {
  const defaultHeader = await readFile(join(ROOT, "components/layout/Header.vue"), "utf8");
  const netdiskHeader = await readFile(join(ROOT, "components/layout/netdisk/Header.vue"), "utf8");

  assert.match(defaultHeader, /publicNavigation/);
  assert.match(netdiskHeader, /publicNavigation/);
  assert.match(defaultHeader, /isMobileMenuOpen/);
  assert.match(netdiskHeader, /isMenuOpen/);
});

test("desktop language switches render as icon buttons", async () => {
  const defaultHeader = await readFile(join(ROOT, "components/layout/Header.vue"), "utf8");
  const netdiskHeader = await readFile(join(ROOT, "components/layout/netdisk/Header.vue"), "utf8");

  for (const content of [defaultHeader, netdiskHeader]) {
    assert.match(content, /fa-solid fa-language/);
    assert.match(content, /language\.switch/);
    assert.match(content, /:title="\$t\(`language\.\$\{loc\.code\}`\)"/);
  }
});

test("front-end menu does not display points badges", async () => {
  const defaultHeader = await readFile(join(ROOT, "components/layout/Header.vue"), "utf8");
  const netdiskHeader = await readFile(join(ROOT, "components/layout/netdisk/Header.vue"), "utf8");

  assert.doesNotMatch(defaultHeader, /积分/);
  assert.doesNotMatch(netdiskHeader, /积分/);
});
