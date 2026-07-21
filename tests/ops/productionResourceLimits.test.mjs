import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("production compose constrains host resources", () => {
  const compose = readFileSync(
    join(repoRoot, "deploy/docker-compose.prod.yml"),
    "utf8",
  );

  assert.match(compose, /WEB_CONCURRENCY:\s*\$\{WEB_CONCURRENCY:-2\}/);
  assert.match(
    compose,
    /NODE_MAX_OLD_SPACE_SIZE_MB:\s*\$\{NODE_MAX_OLD_SPACE_SIZE_MB:-320\}/,
  );
  assert.match(compose, /APP_MEMORY_LIMIT:-1024m/);
  assert.match(compose, /APP_MEMORY_SWAP_LIMIT:-1280m/);
  assert.match(compose, /POSTGRES_MEMORY_LIMIT:-768m/);
  assert.match(compose, /REDIS_MEMORY_LIMIT:-256m/);
  assert.match(compose, /BACKUP_MEMORY_LIMIT:-256m/);
  assert.match(compose, /healthcheck:[\s\S]*127\.0\.0\.1:3000\/api\/health/);
});

test("production data stores are not exposed on public host interfaces", () => {
  const compose = readFileSync(
    join(repoRoot, "deploy/docker-compose.prod.yml"),
    "utf8",
  );

  assert.doesNotMatch(compose, /["']?6379:6379["']?/);
  assert.doesNotMatch(compose, /-\s*["']5432:5432["']/);
  assert.match(
    compose,
    /127\.0\.0\.1:\$\{POSTGRES_HOST_PORT:-5432\}:5432/,
  );
});

test("PM2 accepts bounded production overrides", () => {
  const previous = {
    WEB_CONCURRENCY: process.env.WEB_CONCURRENCY,
    NODE_MAX_OLD_SPACE_SIZE_MB: process.env.NODE_MAX_OLD_SPACE_SIZE_MB,
    PM2_MAX_MEMORY_RESTART: process.env.PM2_MAX_MEMORY_RESTART,
  };

  process.env.WEB_CONCURRENCY = "3";
  process.env.NODE_MAX_OLD_SPACE_SIZE_MB = "384";
  process.env.PM2_MAX_MEMORY_RESTART = "448M";

  try {
    const require = createRequire(import.meta.url);
    const configPath = join(repoRoot, "ecosystem.config.cjs");
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);
    const app = config.apps[0];

    assert.equal(app.instances, 3);
    assert.deepEqual(app.node_args, ["--max-old-space-size=384"]);
    assert.equal(app.max_memory_restart, "448M");
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
