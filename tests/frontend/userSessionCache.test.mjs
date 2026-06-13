import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

const readProjectFile = (filePath) => readFile(join(ROOT, filePath), "utf8");

test("login returns point fields so redirected pages can use the cached session", async () => {
  const loginApi = await readProjectFile("server/api/user/login.ts");

  assert.match(loginApi, /getUserPointsBreakdown/);
  assert.match(loginApi, /pointsBreakdown/);
  assert.match(loginApi, /effectivePoints/);
});

test("user store exposes a deduped session readiness action", async () => {
  const userStore = await readProjectFile("stores/user.ts");

  assert.match(userStore, /pendingUserInfoRequest/);
  assert.match(userStore, /USER_SESSION_FRESHNESS_MS/);
  assert.match(userStore, /ensureUserSession/);
  assert.match(userStore, /isAuthenticated:\s*true/);
});

test("feature access and search page consume stable cached session state", async () => {
  const featureAccess = await readProjectFile("composables/useFeatureAccess.ts");
  const searchPage = await readProjectFile("pages/search.vue");

  assert.match(featureAccess, /ensureUserSession/);
  assert.doesNotMatch(featureAccess, /safeRefreshUser/);
  assert.match(searchPage, /ensureUserSession/);
  assert.match(searchPage, /accessStatus\.value\.checked\s*&&\s*!accessStatus\.value\.allowed/);
  assert.doesNotMatch(searchPage, /accessStatus\.value\.loading\s*\|\|/);
});

test("search page keeps typed searches and route keyword in sync", async () => {
  const searchPage = await readProjectFile("pages/search.vue");

  assert.match(searchPage, /const\s+router\s*=\s*useRouter\(\)/);
  assert.match(searchPage, /query:\s*\{[\s\S]*keyword:\s*normalizedKeyword/);
});
