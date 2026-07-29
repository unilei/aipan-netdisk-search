import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const deployScript = join(repoRoot, "deploy/remote-deploy.sh");

const fakeDocker = `#!/bin/sh
set -eu

printf '%s\\n' "$*" >> "$FAKE_DOCKER_LOG"

if [ "$1" = "compose" ] && [ "\${2:-}" = "version" ]; then
  exit 0
fi

if [ "$1" = "inspect" ]; then
  printf 'running\\n'
  exit 0
fi

if [ "$1" = "exec" ]; then
  container="\${2:-}"
  if [ "$container" = "app-container" ] && [ "\${FAIL_NEW_APP_HEALTH:-0}" = "1" ]; then
    if grep -q '^APP_IMAGE=old-image$' "$DEPLOY_DIR/.env"; then
      exit 0
    fi
    exit 1
  fi
  exit 0
fi

if [ "$1" = "compose" ]; then
  case "$*" in
    *" run "*)
      printf 'candidate-container\\n'
      ;;
    *" ps -q aipan-netdisk-search"*)
      printf 'app-container\\n'
      ;;
  esac
fi
`;

function runDeployment({ failNewAppHealth = false } = {}) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "aipan-deploy-test-"));
  const deployDir = join(fixtureRoot, "deploy");
  const binDir = join(fixtureRoot, "bin");
  const dockerLog = join(fixtureRoot, "docker.log");

  mkdirSync(deployDir);
  mkdirSync(binDir);
  writeFileSync(join(deployDir, "docker-compose.prod.yml"), "services: {}\n");
  writeFileSync(join(deployDir, ".env"), "APP_IMAGE=old-image\n");
  writeFileSync(join(deployDir, ".env.production"), "APP_IMAGE=new-image\n");
  writeFileSync(dockerLog, "");

  const dockerPath = join(binDir, "docker");
  writeFileSync(dockerPath, fakeDocker);
  chmodSync(dockerPath, 0o755);

  const result = spawnSync("sh", [deployScript], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      DEPLOY_DIR: deployDir,
      DOCKERHUB_USERNAME: "test-user",
      DOCKERHUB_TOKEN: "test-token",
      DEPLOY_HEALTH_TIMEOUT_SECONDS: "1",
      DEPLOY_HEALTH_POLL_SECONDS: "1",
      FAIL_NEW_APP_HEALTH: failNewAppHealth ? "1" : "0",
      FAKE_DOCKER_LOG: dockerLog,
    },
  });

  return {
    fixtureRoot,
    result,
    activeEnv: readFileSync(join(deployDir, ".env"), "utf8"),
    rollbackEnv: readFileSync(join(deployDir, ".env.rollback"), "utf8"),
    dockerLog: readFileSync(dockerLog, "utf8"),
  };
}

test("production deployment preflights and health-checks before ancillary services", (t) => {
  const { fixtureRoot, result, activeEnv, rollbackEnv, dockerLog } =
    runDeployment();
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  assert.equal(result.status, 0, result.stderr);
  assert.equal(activeEnv, "APP_IMAGE=new-image\n");
  assert.equal(rollbackEnv, "APP_IMAGE=old-image\n");
  assert.match(
    dockerLog,
    /compose .* run -d --no-deps --name aipan-release-candidate/,
  );

  const appStart = dockerLog.indexOf("up -d --no-deps aipan-netdisk-search");
  const appHealth = dockerLog.indexOf("exec app-container node -e");
  const backupStart = dockerLog.indexOf("up -d --no-deps postgres-backup");

  assert.ok(appStart >= 0, "application replacement was not invoked");
  assert.ok(
    appHealth > appStart,
    "application was not checked after replacement",
  );
  assert.ok(
    backupStart > appHealth,
    "backup service started before the application health gate",
  );
});

test("production deployment restores the previous release after a failed cutover", (t) => {
  const { fixtureRoot, result, activeEnv, dockerLog } = runDeployment({
    failNewAppHealth: true,
  });
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  assert.notEqual(result.status, 0);
  assert.equal(activeEnv, "APP_IMAGE=old-image\n");
  assert.match(result.stderr, /restoring the previous release/);
  assert.match(result.stderr, /Previous release restored successfully/);

  const appStarts = dockerLog.match(/up -d --no-deps aipan-netdisk-search/g);
  assert.equal(appStarts?.length, 2, "expected cutover and rollback starts");
});

test("production deploys are queued instead of cancelling an active cutover", () => {
  const workflow = readFileSync(
    join(repoRoot, ".github/workflows/deploy.yml"),
    "utf8",
  );

  assert.match(
    workflow,
    /concurrency:\s*\n\s*group: production-deploy\s*\n\s*cancel-in-progress: false/,
  );
});
