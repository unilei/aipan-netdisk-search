import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const nuxtConfig = readFileSync(new URL("../../nuxt.config.ts", import.meta.url), "utf8");

test("Nuxt app manifest is disabled for indexable public pages", () => {
  assert.match(
    nuxtConfig,
    /\n  experimental:\s*{[\s\S]*?\n\s*appManifest:\s*false,/,
    "Public pages should not depend on /_nuxt/builds/meta/*.json during Google rendering.",
  );
  assert.doesNotMatch(nuxtConfig, /appManifest:\s*true/);
});

test("Nitro bundles the root Prisma module so Nuxt aliases resolve in development", () => {
  assert.match(nuxtConfig, /const NITRO_INLINE_ROOT_MODULES = \[/);
  assert.match(nuxtConfig, /new URL\('\.\/lib\/prisma\.js', import\.meta\.url\)/);
  assert.match(nuxtConfig, /new URL\('\.\/utils\/', import\.meta\.url\)/);
  assert.match(
    nuxtConfig,
    /externals:\s*{\s*inline:\s*NITRO_INLINE_ROOT_MODULES,?\s*}/,
  );
});
