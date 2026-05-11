import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const loginPageSource = readFileSync(
  new URL("../../pages/login.vue", import.meta.url),
  "utf8"
);

test("login page honors safe redirect query paths after authentication", () => {
  assert.match(
    loginPageSource,
    /safeRedirectPath/,
    "login page should derive a safe redirect path from route.query.redirect"
  );
  assert.match(
    loginPageSource,
    /route\.query\.redirect/,
    "login page should read the redirect query produced by forum entry points"
  );
  assert.match(
    loginPageSource,
    /requestedRedirect\.startsWith\("\/"\)/,
    "redirect query should be constrained to local absolute paths"
  );
});
