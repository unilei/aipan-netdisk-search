import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const readSourceApis = async (fileName) => {
  const filePath = path.join(process.cwd(), "assets", "vod", fileName);
  const sources = JSON.parse(await readFile(filePath, "utf8"));

  return sources.map((source) => source.api);
};

test("guest source config enables sohaoju and excludes broken sources", async () => {
  const apis = await readSourceApis("clouddrive.json");

  assert.ok(apis.includes("/api/sources/sohaoju"));
  assert.equal(apis.includes("/api/sources/vipray"), false);
  assert.equal(apis.includes("/api/sources/slowread"), false);
  assert.equal(new Set(apis).size, apis.length);
});

test("login source config enables sohaoju and excludes broken sources", async () => {
  const apis = await readSourceApis("clouddrive-login.json");

  assert.ok(apis.includes("/api/sources/sohaoju"));
  assert.ok(apis.includes("/api/sources/duoduo"));
  assert.equal(apis.includes("/api/sources/vipray-auth"), false);
  assert.equal(apis.includes("/api/sources/slowread"), false);
  assert.equal(new Set(apis).size, apis.length);
});
