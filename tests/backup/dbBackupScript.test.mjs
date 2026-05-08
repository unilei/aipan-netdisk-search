import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("database backup script uploads to the R2 prefix and prunes old backups", () => {
  const workdir = mkdtempSync(join(tmpdir(), "aipan-db-backup-"));

  try {
    const binDir = join(workdir, "bin");
    mkdirSync(binDir);

    const pgDumpArgsFile = join(workdir, "pg-dump-args.txt");
    const pgPasswordFile = join(workdir, "pg-password.txt");
    const awsCallsFile = join(workdir, "aws-calls.txt");

    writeFileSync(
      join(binDir, "pg_dump"),
      `#!/bin/sh
printf '%s\\n' "$*" > "$PG_DUMP_ARGS_FILE"
printf '%s\\n' "$PGPASSWORD" > "$PG_PASSWORD_FILE"
printf '%s\\n' 'CREATE TABLE backup_probe(id int);'
`,
    );
    chmodSync(join(binDir, "pg_dump"), 0o755);

    writeFileSync(
      join(binDir, "aws"),
      `#!/bin/sh
printf '%s\\n' "$*" >> "$AWS_CALLS_FILE"
operation=""
for arg in "$@"; do
  case "$arg" in
    cp|list-objects-v2|delete-object) operation="$arg" ;;
  esac
done

case "$operation" in
  cp)
    previous=""
    for arg in "$@"; do
      if [ "$previous" = "cp" ]; then
        if [ ! -s "$arg" ]; then
          echo "backup file is empty" >&2
          exit 2
        fi
        break
      fi
      previous="$arg"
    done
    ;;
  list-objects-v2)
    printf '%s\\n' \\
      'aipan/postgres/aipan-old-01.sql.gz' \\
      'aipan/postgres/aipan-old-02.sql.gz' \\
      'aipan/postgres/aipan-old-03.sql.gz' \\
      'aipan/postgres/aipan-old-04.sql.gz' \\
      'aipan/postgres/aipan-old-05.sql.gz' \\
      'aipan/postgres/aipan-old-06.sql.gz' \\
      'aipan/postgres/aipan-old-07.sql.gz' \\
      'aipan/postgres/aipan-old-08.sql.gz' \\
      'aipan/postgres/aipan-old-09.sql.gz' \\
      'aipan/postgres/aipan-old-10.sql.gz' \\
      'aipan/postgres/aipan-new-11.sql.gz'
    ;;
esac
`,
    );
    chmodSync(join(binDir, "aws"), 0o755);

    const result = spawnSync("sh", ["deploy/db-backup/backup.sh", "--once"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        AWS_CALLS_FILE: awsCallsFile,
        PG_DUMP_ARGS_FILE: pgDumpArgsFile,
        PG_PASSWORD_FILE: pgPasswordFile,
        POSTGRES_HOST: "postgres",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "secret",
        POSTGRES_DB: "aipan",
        R2_ACCOUNT_ID: "account-id",
        R2_ACCESS_KEY_ID: "access-key",
        R2_SECRET_ACCESS_KEY: "secret-key",
        R2_BUCKET: "aipan-backups",
        R2_PREFIX: "aipan/postgres",
        DB_BACKUP_RETENTION: "10",
      },
    });

    assert.equal(
      result.status,
      0,
      `backup script failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );

    const pgDumpArgs = readFileSync(pgDumpArgsFile, "utf8");
    assert.match(pgDumpArgs, /-h postgres/);
    assert.match(pgDumpArgs, /-p 5432/);
    assert.match(pgDumpArgs, /-U postgres/);
    assert.match(pgDumpArgs, /-d aipan/);
    assert.equal(readFileSync(pgPasswordFile, "utf8").trim(), "secret");

    const awsCalls = readFileSync(awsCallsFile, "utf8");
    assert.match(awsCalls, /--endpoint-url https:\/\/account-id\.r2\.cloudflarestorage\.com/);
    assert.match(awsCalls, /s3:\/\/aipan-backups\/aipan\/postgres\/aipan-\d{8}-\d{6}\.sql\.gz/);
    assert.match(awsCalls, /s3api delete-object/);
    assert.match(awsCalls, /--key aipan\/postgres\/aipan-old-01\.sql\.gz/);
    assert.doesNotMatch(awsCalls, /--key aipan\/postgres\/aipan-old-02\.sql\.gz/);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("production deployment wires scheduled R2 database backups", () => {
  const compose = readFileSync(
    join(repoRoot, "deploy/docker-compose.prod.yml"),
    "utf8",
  );
  const envExample = readFileSync(
    join(repoRoot, "deploy/.env.production.example"),
    "utf8",
  );
  const workflow = readFileSync(
    join(repoRoot, ".github/workflows/deploy.yml"),
    "utf8",
  );
  const dockerfile = readFileSync(join(repoRoot, "Dockerfile"), "utf8");
  const ecosystemConfig = readFileSync(join(repoRoot, "ecosystem.config.js"), "utf8");

  assert.match(compose, /postgres-backup:/);
  assert.match(compose, /DB_BACKUP_IMAGE/);
  assert.match(compose, /DB_BACKUP_TIME:\s*\$\{DB_BACKUP_TIME:-03:00\}/);
  assert.match(compose, /DB_BACKUP_RETENTION:\s*\$\{DB_BACKUP_RETENTION:-10\}/);
  assert.match(compose, /R2_PREFIX:\s*\$\{R2_PREFIX:-aipan\/postgres\}/);
  assert.match(compose, /POSTGRES_HOST:\s*postgres/);
  assert.match(compose, /R2_ACCESS_KEY_ID:\s*\$\{R2_ACCESS_KEY_ID:-\}/);

  assert.match(envExample, /DB_BACKUP_TIME=03:00/);
  assert.match(envExample, /DB_BACKUP_RETENTION=10/);
  assert.match(envExample, /R2_PREFIX=aipan\/postgres/);
  assert.match(envExample, /R2_BUCKET=/);

  assert.match(workflow, /DB_BACKUP_IMAGE/);
  assert.match(workflow, /db-backup-sha-/);
  assert.match(workflow, /R2_ACCESS_KEY_ID/);
  assert.match(workflow, /R2_SECRET_ACCESS_KEY/);

  assert.match(dockerfile, /aws-cli/);
  assert.match(dockerfile, /postgresql-client/);
  assert.match(ecosystemConfig, /R2_ACCESS_KEY_ID/);
  assert.match(ecosystemConfig, /POSTGRES_HOST/);
});
