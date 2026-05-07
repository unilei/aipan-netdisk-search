import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const robotsTxt = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");

test("robots.txt allows Nuxt and i18n JSON required for page rendering", () => {
  assert.doesNotMatch(
    robotsTxt,
    /^Disallow:\s*\/\*\.json\$/m,
    "Do not block all JSON files; Nuxt build metadata and i18n messages are render-critical.",
  );
  assert.match(robotsTxt, /^Allow:\s*\/_nuxt\//m);
  assert.match(robotsTxt, /^Allow:\s*\/_i18n\//m);
});

test("robots.txt still keeps private application areas out of crawling", () => {
  assert.match(robotsTxt, /^Disallow:\s*\/admin\//m);
  assert.match(robotsTxt, /^Disallow:\s*\/api\//m);
  assert.match(robotsTxt, /^Disallow:\s*\/user\//m);
});
