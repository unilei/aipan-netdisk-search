import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loginPageSource = readFileSync(
  new URL("../../pages/login.vue", import.meta.url),
  "utf8",
);

test("login page honors safe redirect query paths after authentication", () => {
  assert.match(loginPageSource, /safeRedirectPath/);
  assert.match(loginPageSource, /route\.query\.redirect/);
  assert.match(loginPageSource, /requestedRedirect\.startsWith\("\/"\)/);
});
