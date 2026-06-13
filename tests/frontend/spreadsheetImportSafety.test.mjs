import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

const spreadsheetImportPages = [
  "pages/user/resources/list.vue",
  "pages/admin/clouddrive/index.vue",
];

const readProjectFile = (filePath) => readFile(join(ROOT, filePath), "utf8");

test("spreadsheet imports avoid the vulnerable xlsx package and reject legacy xls files", async () => {
  const packageJson = JSON.parse(await readProjectFile("package.json"));

  assert.equal(packageJson.dependencies?.xlsx, undefined);
  assert.match(packageJson.dependencies?.["read-excel-file"] || "", /^\^9\./);

  for (const pagePath of spreadsheetImportPages) {
    const source = await readProjectFile(pagePath);

    assert.match(source, /import\s+\{\s*readSheet\s*\}\s+from\s+["']read-excel-file\/browser["']/);
    assert.match(source, /readSheet\(file\)/);
    assert.match(source, /accept=["']\.csv,\.xlsx["']/);
    assert.doesNotMatch(source, /from\s+["']read-excel-file["']/);
    assert.doesNotMatch(source, /import\(["']xlsx["']\)/);
    assert.doesNotMatch(source, /["']xls["']/);
  }
});
