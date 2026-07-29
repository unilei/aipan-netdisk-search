import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readProjectFile = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("Xiaokupan failures are bounded and are not cached as successful empty results", () => {
  const sourceApi = readProjectFile("server/api/sources/xiaokupan.ts");
  const searchLogic = readProjectFile("composables/useSearchLogic.js");

  assert.match(sourceApi, /SEARCH_TIMEOUT_MS\s*=\s*6000/);
  assert.match(sourceApi, /retry:\s*0/);
  assert.match(sourceApi, /setResponseStatus\(event, statusCode\)/);
  assert.match(searchLogic, /api === "\/api\/sources\/xiaokupan" \? 1 : 3/);
  assert.match(searchLogic, /getSourceMaxAttempts\(item\.api\)/);
});

test("Quark verification uses a bounded retry and exposes upstream HTTP failures", () => {
  const validateApi = readProjectFile("server/api/quark/validate.post.ts");
  const verificationPage = readProjectFile("pages/quark-verification.vue");

  assert.match(validateApi, /timeout:\s*6000/);
  assert.match(validateApi, /retry:\s*1/);
  assert.match(validateApi, /retryDelay:\s*250/);
  assert.match(validateApi, /setResponseStatus\(event, statusCode\)/);
  assert.match(verificationPage, /error\?\.data\?\.msg/);
});

test("Email verification treats expected client errors as messages, not server errors", () => {
  const emailService = readProjectFile("server/services/email/emailVerification.ts");
  const verifyApi = readProjectFile("server/api/user/email/verify.post.ts");

  assert.doesNotMatch(emailService, /statusMessage:/);
  assert.match(emailService, /message: "验证链接无效或已过期"/);
  assert.match(verifyApi, /if \(statusCode >= 500\)/);
});

test("Public navigation failures avoid non-ASCII HTTP status messages", () => {
  const navigationApi = readProjectFile("server/api/navigation/index.get.ts");

  assert.doesNotMatch(navigationApi, /statusMessage:/);
  assert.match(navigationApi, /message: '获取导航数据失败'/);
});
