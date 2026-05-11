import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const SCAN_DIRS = ["pages", "components", "layouts"];

async function* vueFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* vueFiles(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".vue")) {
      yield fullPath;
    }
  }
}

test("Element Plus table loading is attached to a stable wrapper", async () => {
  const violations = [];

  for (const scanDir of SCAN_DIRS) {
    for await (const file of vueFiles(join(ROOT, scanDir))) {
      const content = await readFile(file, "utf8");
      const tableTags = content.match(/<el-table\b[^>]*>/gs) || [];

      for (const tag of tableTags) {
        if (/\bv-loading(?:\s|=|$)/.test(tag)) {
          violations.push(`${relative(ROOT, file)}: ${tag.replace(/\s+/g, " ").trim()}`);
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("admin comments keeps v-loading on a stable wrapper", async () => {
  const content = await readFile(join(ROOT, "pages/admin/comments/index.vue"), "utf8");

  assert.match(content, /<div\s+v-loading="loading"/);
});

test("admin comments loading starts inactive and is driven by fetch lifecycle", async () => {
  const content = await readFile(join(ROOT, "pages/admin/comments/index.vue"), "utf8");

  assert.match(content, /const\s+loading\s*=\s*ref\(false\)/);
  assert.match(content, /loading\.value\s*=\s*true;[\s\S]*?\$fetch\(`/);
  assert.match(content, /finally\s*{[\s\S]*?loading\.value\s*=\s*false;/);
});
