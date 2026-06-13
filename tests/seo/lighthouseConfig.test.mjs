import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);

test("project exposes Lighthouse CI through npm scripts", () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

  assert.equal(packageJson.scripts["lighthouse:ci"], "lhci autorun");
  assert.equal(packageJson.scripts["lighthouse:healthcheck"], "lhci healthcheck --fatal");
  assert.ok(packageJson.devDependencies["@lhci/cli"]);
});

test("Lighthouse CI audits production preview routes with stable collection settings", () => {
  const configPath = join(ROOT, "lighthouserc.cjs");

  assert.ok(existsSync(configPath), "lighthouserc.cjs should exist at the project root");

  const lighthouseConfig = require(configPath);
  const collect = lighthouseConfig.ci.collect;

  assert.match(collect.startServerCommand, /lighthouse-assert-port-free\.mjs 45173/);
  assert.match(collect.startServerCommand, /lighthouse-assert-port-free\.mjs 45174/);
  assert.match(collect.startServerCommand, /npm run preview/);
  assert.equal(collect.startServerReadyPattern, "Listening on http://.*:45173");
  assert.deepEqual(collect.url, [
    "http://127.0.0.1:45173/",
    "http://127.0.0.1:45173/about",
  ]);
  assert.equal(collect.numberOfRuns, 3);
  assert.match(collect.settings.chromeFlags, /--no-sandbox/);
});

test("Lighthouse CI starts with non-blocking score assertions", () => {
  const lighthouseConfig = require(join(ROOT, "lighthouserc.cjs"));
  const assertConfig = lighthouseConfig.ci.assert;

  assert.equal(assertConfig.preset, undefined);

  for (const category of [
    "categories:performance",
    "categories:accessibility",
    "categories:best-practices",
    "categories:seo",
  ]) {
    assert.equal(assertConfig.assertions[category][0], "warn");
  }
});

test("GitHub Actions runs Lighthouse CI after building the Nuxt app", () => {
  const workflowPath = join(ROOT, ".github/workflows/lighthouse.yml");

  assert.ok(existsSync(workflowPath), "Lighthouse workflow should exist");

  const workflow = readFileSync(workflowPath, "utf8");

  assert.match(workflow, /name:\s*Lighthouse CI/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run lighthouse:ci/);
});
