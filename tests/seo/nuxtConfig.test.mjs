import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const nuxtConfig = readFileSync(new URL("../../nuxt.config.ts", import.meta.url), "utf8");

test("Nuxt app manifest is disabled for indexable public pages", () => {
  assert.match(
    nuxtConfig,
    /\n  experimental:\s*{\s*\n\s*appManifest:\s*false,?\s*\n\s*},/,
    "Public pages should not depend on /_nuxt/builds/meta/*.json during Google rendering.",
  );
  assert.doesNotMatch(nuxtConfig, /appManifest:\s*true/);
});
