import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const robotsTxt = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");

test("robots.txt does not block render-critical Nuxt and i18n assets", () => {
  assert.doesNotMatch(
    robotsTxt,
    /^Disallow:\s*\/\*\.json\$/m,
    "Do not block all JSON files; Nuxt and i18n JSON can be render-critical.",
  );
  assert.doesNotMatch(robotsTxt, /^Disallow:\s*\/_nuxt\//m);
  assert.doesNotMatch(robotsTxt, /^Disallow:\s*\/_i18n\//m);
});

test("robots.txt keeps admin pages out of crawling", () => {
  assert.match(robotsTxt, /^Disallow:\s*\/admin\//m);
});
