import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  createDatabaseBackupDownloadUrl,
  createManualDatabaseBackup,
  listDatabaseBackups,
  normalizeBackupPrefix,
  resolveDatabaseBackupConfig,
} from "../../server/services/databaseBackups/r2CliBackups.mjs";

const createFakeCliBin = (workdir) => {
  const binDir = join(workdir, "bin");
  mkdirSync(binDir);

  writeFileSync(
    join(binDir, "pg_dump"),
    `#!/bin/sh
printf '%s\\n' "$*" > "$PG_DUMP_ARGS_FILE"
printf '%s\\n' "$PGPASSWORD" > "$PG_PASSWORD_FILE"
printf '%s\\n' 'CREATE TABLE manual_backup_probe(id int);'
`,
  );
  chmodSync(join(binDir, "pg_dump"), 0o755);

  writeFileSync(
    join(binDir, "gzip"),
    `#!/bin/sh
if [ "$1" = "-f" ]; then
  src="$2"
else
  src="$1"
fi
cp "$src" "$src.gz"
rm -f "$src"
`,
  );
  chmodSync(join(binDir, "gzip"), 0o755);

  writeFileSync(
    join(binDir, "aws"),
    `#!/bin/sh
endpoint=""
if [ "$1" = "--endpoint-url" ]; then
  endpoint="$2"
  shift 2
fi
printf 'endpoint=%s args=%s\\n' "$endpoint" "$*" >> "$AWS_CALLS_FILE"

if [ "$1" = "s3api" ] && [ "$2" = "list-objects-v2" ]; then
  cat <<'JSON'
{
  "IsTruncated": false,
  "Contents": [
    {"Key": "aipan/postgres/aipan-old-01.sql.gz", "LastModified": "2026-05-01T00:00:00Z", "Size": 101, "ETag": "\\"old-01\\""},
    {"Key": "aipan/postgres/aipan-old-02.sql.gz", "LastModified": "2026-05-02T00:00:00Z", "Size": 102, "ETag": "\\"old-02\\""},
    {"Key": "aipan/postgres/aipan-new-03.sql.gz", "LastModified": "2026-05-03T00:00:00Z", "Size": 103, "ETag": "\\"new-03\\""},
    {"Key": "aipan/postgres/readme.txt", "LastModified": "2026-05-04T00:00:00Z", "Size": 104, "ETag": "\\"txt\\""},
    {"Key": "other/prefix/aipan.sql.gz", "LastModified": "2026-05-05T00:00:00Z", "Size": 105, "ETag": "\\"other\\""}
  ]
}
JSON
  exit 0
fi

if [ "$1" = "s3" ] && [ "$2" = "cp" ]; then
  if [ ! -s "$3" ]; then
    echo "backup file is empty" >&2
    exit 2
  fi
  exit 0
fi

if [ "$1" = "s3api" ] && [ "$2" = "head-object" ]; then
  printf '%s\\n' '{"ContentLength":103}'
  exit 0
fi

if [ "$1" = "s3" ] && [ "$2" = "presign" ]; then
  printf '%s\\n' 'https://download.example.com/signed-backup-url'
  exit 0
fi

if [ "$1" = "s3api" ] && [ "$2" = "delete-object" ]; then
  exit 0
fi

echo "unexpected aws command: $*" >&2
exit 1
`,
  );
  chmodSync(join(binDir, "aws"), 0o755);

  return binDir;
};

const createEnv = () => ({
  DATABASE_URL: "postgresql://dbuser:dbpass@postgres:5432/aipan?schema=public",
  R2_ACCOUNT_ID: "account-id",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET: "aipan-backups",
  R2_PREFIX: "/aipan/postgres/",
  DB_BACKUP_RETENTION: "2",
});

test("manual admin database backup uploads a pg_dump and prunes by retention", async () => {
  const workdir = mkdtempSync(join(tmpdir(), "aipan-admin-db-backup-test-"));

  try {
    const binDir = createFakeCliBin(workdir);
    const awsCallsFile = join(workdir, "aws-calls.txt");
    const pgDumpArgsFile = join(workdir, "pg-dump-args.txt");
    const pgPasswordFile = join(workdir, "pg-password.txt");
    const commandEnv = {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      AWS_CALLS_FILE: awsCallsFile,
      PG_DUMP_ARGS_FILE: pgDumpArgsFile,
      PG_PASSWORD_FILE: pgPasswordFile,
    };

    const backup = await createManualDatabaseBackup({
      processEnv: createEnv(),
      commandEnv,
      now: new Date(2026, 4, 8, 3, 4, 5),
    });

    assert.equal(backup.key, "aipan/postgres/aipan-20260508-030405.sql.gz");
    assert.equal(backup.fileName, "aipan-20260508-030405.sql.gz");
    assert.ok(backup.size > 0);

    const pgDumpArgs = readFileSync(pgDumpArgsFile, "utf8");
    assert.match(pgDumpArgs, /-h postgres/);
    assert.match(pgDumpArgs, /-p 5432/);
    assert.match(pgDumpArgs, /-U dbuser/);
    assert.match(pgDumpArgs, /-d aipan/);
    assert.equal(readFileSync(pgPasswordFile, "utf8").trim(), "dbpass");

    const awsCalls = readFileSync(awsCallsFile, "utf8");
    assert.match(awsCalls, /endpoint=https:\/\/account-id\.r2\.cloudflarestorage\.com/);
    assert.match(awsCalls, /s3 cp .* s3:\/\/aipan-backups\/aipan\/postgres\/aipan-20260508-030405\.sql\.gz/);
    assert.match(awsCalls, /s3api delete-object .* --key aipan\/postgres\/aipan-old-01\.sql\.gz/);
    assert.doesNotMatch(awsCalls, /--key aipan\/postgres\/aipan-old-02\.sql\.gz/);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("admin database backup list filters and sorts R2 backup objects", async () => {
  const workdir = mkdtempSync(join(tmpdir(), "aipan-admin-db-backup-list-test-"));

  try {
    const binDir = createFakeCliBin(workdir);
    const backups = await listDatabaseBackups({
      processEnv: createEnv(),
      commandEnv: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        AWS_CALLS_FILE: join(workdir, "aws-calls.txt"),
      },
    });

    assert.deepEqual(
      backups.map((backup) => backup.key),
      [
        "aipan/postgres/aipan-new-03.sql.gz",
        "aipan/postgres/aipan-old-02.sql.gz",
        "aipan/postgres/aipan-old-01.sql.gz",
      ],
    );
    assert.equal(backups[0].fileName, "aipan-new-03.sql.gz");
    assert.equal(backups[0].size, 103);
    assert.equal(backups[0].eTag, "new-03");
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("admin database backup download only signs keys inside the configured prefix", async () => {
  const workdir = mkdtempSync(join(tmpdir(), "aipan-admin-db-backup-download-test-"));

  try {
    const binDir = createFakeCliBin(workdir);
    const commandEnv = {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH}`,
      AWS_CALLS_FILE: join(workdir, "aws-calls.txt"),
    };

    const signed = await createDatabaseBackupDownloadUrl(
      "aipan/postgres/aipan-new-03.sql.gz",
      {
        processEnv: createEnv(),
        commandEnv,
        now: new Date("2026-05-08T00:00:00Z"),
      },
    );

    assert.equal(signed.url, "https://download.example.com/signed-backup-url");
    assert.equal(signed.expiresInSeconds, 300);
    assert.equal(signed.expiresAt, "2026-05-08T00:05:00.000Z");

    await assert.rejects(
      () => createDatabaseBackupDownloadUrl("other/prefix/aipan.sql.gz", {
        processEnv: createEnv(),
        commandEnv,
      }),
      /备份文件 key 不合法/,
    );
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
});

test("database backup config normalizes prefixes and derives R2 endpoint", () => {
  assert.equal(normalizeBackupPrefix("/aipan/postgres///"), "aipan/postgres");

  const config = resolveDatabaseBackupConfig(createEnv());
  assert.equal(config.r2Endpoint, "https://account-id.r2.cloudflarestorage.com");
  assert.equal(config.postgresHost, "postgres");
  assert.equal(config.postgresUser, "dbuser");
  assert.equal(config.retention, 2);
});
