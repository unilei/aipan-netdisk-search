import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const readSourceApis = async (fileName) => {
  const filePath = path.join(process.cwd(), "assets", "vod", fileName);
  const sources = JSON.parse(await readFile(filePath, "utf8"));

  return sources.map((source) => source.api);
};

const expectedSources = [
  "/api/sources/local",
  "/api/sources/pansou",
  "/api/sources/external-pan",
  "/api/sources/xiaokupan",
];

test("guest source config only enables maintained sources", async () => {
  const apis = await readSourceApis("clouddrive.json");

  assert.deepEqual(apis, expectedSources);
  assert.equal(new Set(apis).size, apis.length);
});

test("login source config only enables maintained sources", async () => {
  const apis = await readSourceApis("clouddrive-login.json");

  assert.deepEqual(apis, expectedSources);
  assert.equal(new Set(apis).size, apis.length);
});
