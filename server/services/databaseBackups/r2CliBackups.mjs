import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { finished } from "node:stream/promises";

const DEFAULT_PREFIX = "aipan/postgres";
const DEFAULT_RETENTION = 10;
const DEFAULT_AWS_REGION = "auto";
const DOWNLOAD_EXPIRES_SECONDS = 300;

let manualBackupInFlight = null;

export class DatabaseBackupError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "DatabaseBackupError";
    this.statusCode = statusCode;
  }
}

const singleValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const nonEmpty = (value) => {
  const normalized = singleValue(value);
  if (normalized === undefined || normalized === null) {
    return "";
  }
  return String(normalized).trim();
};

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    return {};
  }

  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || "5432",
      user: decodeURIComponent(url.username || ""),
      password: decodeURIComponent(url.password || ""),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    };
  } catch {
    return {};
  }
};

const requireConfigValue = (config, key, label) => {
  if (!config[key]) {
    throw new DatabaseBackupError(`${label} 未配置`, 500);
  }
};

const parsePositiveInteger = (value, fallback) => {
  const number = Number.parseInt(nonEmpty(value), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

export const normalizeBackupPrefix = (prefix = DEFAULT_PREFIX) => {
  let normalized = nonEmpty(prefix) || DEFAULT_PREFIX;
  normalized = normalized.replace(/^\/+/, "");
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || DEFAULT_PREFIX;
};

export const formatBackupTimestamp = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
};

export const resolveDatabaseBackupConfig = (processEnv = process.env) => {
  const parsedDatabaseUrl = parseDatabaseUrl(
    nonEmpty(processEnv.NUXT_DATABASE_URL) || nonEmpty(processEnv.DATABASE_URL),
  );
  const r2AccountId = nonEmpty(processEnv.R2_ACCOUNT_ID);
  const r2Endpoint = nonEmpty(processEnv.R2_ENDPOINT)
    || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");

  const config = {
    postgresHost: nonEmpty(processEnv.POSTGRES_HOST) || parsedDatabaseUrl.host || "postgres",
    postgresPort: nonEmpty(processEnv.POSTGRES_PORT) || parsedDatabaseUrl.port || "5432",
    postgresUser: nonEmpty(processEnv.POSTGRES_USER) || parsedDatabaseUrl.user,
    postgresPassword: nonEmpty(processEnv.POSTGRES_PASSWORD) || parsedDatabaseUrl.password,
    postgresDatabase: nonEmpty(processEnv.POSTGRES_DB) || parsedDatabaseUrl.database,
    r2AccountId,
    r2Endpoint,
    r2AccessKeyId: nonEmpty(processEnv.R2_ACCESS_KEY_ID),
    r2SecretAccessKey: nonEmpty(processEnv.R2_SECRET_ACCESS_KEY),
    r2Bucket: nonEmpty(processEnv.R2_BUCKET),
    r2Prefix: normalizeBackupPrefix(processEnv.R2_PREFIX),
    awsRegion: nonEmpty(processEnv.AWS_DEFAULT_REGION) || DEFAULT_AWS_REGION,
    retention: parsePositiveInteger(processEnv.DB_BACKUP_RETENTION, DEFAULT_RETENTION),
  };

  requireConfigValue(config, "postgresHost", "PostgreSQL host");
  requireConfigValue(config, "postgresPort", "PostgreSQL port");
  requireConfigValue(config, "postgresUser", "PostgreSQL user");
  requireConfigValue(config, "postgresPassword", "PostgreSQL password");
  requireConfigValue(config, "postgresDatabase", "PostgreSQL database");
  requireConfigValue(config, "r2Endpoint", "R2 endpoint 或 R2 account id");
  requireConfigValue(config, "r2AccessKeyId", "R2 access key id");
  requireConfigValue(config, "r2SecretAccessKey", "R2 secret access key");
  requireConfigValue(config, "r2Bucket", "R2 bucket");

  return config;
};

export const getDatabaseBackupAdminConfig = (processEnv = process.env) => {
  const config = resolveDatabaseBackupConfig(processEnv);
  return {
    bucket: config.r2Bucket,
    prefix: config.r2Prefix,
    endpoint: config.r2Endpoint,
    retention: config.retention,
    database: config.postgresDatabase,
    host: config.postgresHost,
  };
};

const truncateForError = (value) => {
  const text = String(value || "").trim();
  if (text.length <= 800) {
    return text;
  }
  return `${text.slice(0, 800)}...`;
};

const waitForChild = (child, command, args, readStderr) => new Promise((resolve, reject) => {
  child.on("error", (error) => {
    reject(new DatabaseBackupError(`${command} 执行失败: ${error.message}`, 500));
  });

  child.on("close", (code) => {
    if (code === 0) {
      resolve();
      return;
    }

    const stderr = truncateForError(readStderr());
    const suffix = stderr ? `: ${stderr}` : "";
    reject(new DatabaseBackupError(`${command} exited with code ${code}${suffix}`, 500));
  });
});

const runCommand = (command, args, { env = process.env } = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("error", (error) => {
    reject(new DatabaseBackupError(`${command} 执行失败: ${error.message}`, 500));
  });

  child.on("close", (code) => {
    if (code === 0) {
      resolve(stdout);
      return;
    }

    const message = truncateForError(stderr || stdout);
    reject(new DatabaseBackupError(`${command} exited with code ${code}${message ? `: ${message}` : ""}`, 500));
  });
});

const buildAwsEnv = (config, commandEnv) => ({
  ...commandEnv,
  AWS_ACCESS_KEY_ID: config.r2AccessKeyId,
  AWS_SECRET_ACCESS_KEY: config.r2SecretAccessKey,
  AWS_DEFAULT_REGION: config.awsRegion,
  AWS_EC2_METADATA_DISABLED: "true",
});

const runAwsCli = async (config, args, { commandEnv = process.env } = {}) => runCommand(
  "aws",
  ["--endpoint-url", config.r2Endpoint, ...args],
  { env: buildAwsEnv(config, commandEnv) },
);

const runAwsJson = async (config, args, options) => {
  const output = await runAwsCli(config, [...args, "--output", "json"], options);
  if (!output.trim()) {
    return {};
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    throw new DatabaseBackupError(`无法解析 AWS CLI 输出: ${error.message}`, 500);
  }
};

const backupKeyAllowed = (key, config) => {
  const normalizedKey = nonEmpty(key);
  const prefix = `${config.r2Prefix}/`;
  return normalizedKey.startsWith(prefix) && normalizedKey.endsWith(".sql.gz");
};

const toBackupRecord = (object) => {
  const lastModified = object.LastModified ? new Date(object.LastModified) : null;
  return {
    key: object.Key,
    fileName: basename(object.Key || ""),
    size: Number(object.Size || 0),
    lastModified: lastModified && !Number.isNaN(lastModified.getTime())
      ? lastModified.toISOString()
      : "",
    eTag: object.ETag ? String(object.ETag).replace(/^"|"$/g, "") : "",
  };
};

export const listDatabaseBackups = async ({
  processEnv = process.env,
  commandEnv = process.env,
} = {}) => {
  const config = resolveDatabaseBackupConfig(processEnv);
  const objects = [];
  let continuationToken = "";

  do {
    const args = [
      "s3api",
      "list-objects-v2",
      "--bucket",
      config.r2Bucket,
      "--prefix",
      `${config.r2Prefix}/`,
    ];

    if (continuationToken) {
      args.push("--continuation-token", continuationToken);
    }

    const result = await runAwsJson(config, args, { commandEnv });
    objects.push(...(Array.isArray(result.Contents) ? result.Contents : []));
    continuationToken = result.IsTruncated ? nonEmpty(result.NextContinuationToken) : "";
  } while (continuationToken);

  return objects
    .filter((object) => object.Key && backupKeyAllowed(object.Key, config))
    .map(toBackupRecord)
    .sort((a, b) => {
      const aTime = Date.parse(a.lastModified) || 0;
      const bTime = Date.parse(b.lastModified) || 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return b.key.localeCompare(a.key);
    });
};

const createPostgresDump = async (config, dumpPath, { commandEnv = process.env } = {}) => {
  const sqlPath = dumpPath.replace(/\.gz$/, "");
  const output = createWriteStream(sqlPath, { mode: 0o600 });
  const child = spawn("pg_dump", [
    "-h",
    config.postgresHost,
    "-p",
    config.postgresPort,
    "-U",
    config.postgresUser,
    "-d",
    config.postgresDatabase,
    "--no-owner",
    "--no-acl",
  ], {
    env: {
      ...commandEnv,
      PGPASSWORD: config.postgresPassword,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.stdout.pipe(output);

  await Promise.all([
    waitForChild(child, "pg_dump", [], () => stderr),
    finished(output),
  ]);

  await runCommand("gzip", ["-f", sqlPath], { env: commandEnv });
};

const uploadBackup = async (config, dumpPath, objectKey, { commandEnv = process.env } = {}) => {
  await runAwsCli(config, [
    "s3",
    "cp",
    dumpPath,
    `s3://${config.r2Bucket}/${objectKey}`,
    "--only-show-errors",
  ], { commandEnv });
};

const deleteBackupObject = async (config, key, { commandEnv = process.env } = {}) => {
  await runAwsCli(config, [
    "s3api",
    "delete-object",
    "--bucket",
    config.r2Bucket,
    "--key",
    key,
  ], { commandEnv });
};

export const pruneOldDatabaseBackups = async ({
  processEnv = process.env,
  commandEnv = process.env,
  config = resolveDatabaseBackupConfig(processEnv),
} = {}) => {
  const backups = await listDatabaseBackups({ processEnv, commandEnv });
  const deleteTargets = backups.slice(config.retention);

  for (const backup of deleteTargets) {
    await deleteBackupObject(config, backup.key, { commandEnv });
  }

  return {
    kept: backups.length - deleteTargets.length,
    deleted: deleteTargets.length,
  };
};

const createManualDatabaseBackupInternal = async ({
  processEnv = process.env,
  commandEnv = process.env,
  now = new Date(),
} = {}) => {
  const config = resolveDatabaseBackupConfig(processEnv);
  const timestamp = formatBackupTimestamp(now);
  const objectKey = `${config.r2Prefix}/${config.postgresDatabase}-${timestamp}.sql.gz`;
  const tempDir = await mkdtemp(join(tmpdir(), "aipan-admin-db-backup-"));
  const dumpPath = join(tempDir, `${config.postgresDatabase}-${timestamp}.sql.gz`);

  try {
    await createPostgresDump(config, dumpPath, { commandEnv });
    const dumpStat = await stat(dumpPath);
    await uploadBackup(config, dumpPath, objectKey, { commandEnv });
    await pruneOldDatabaseBackups({ processEnv, commandEnv, config });

    return {
      key: objectKey,
      fileName: basename(objectKey),
      size: dumpStat.size,
      lastModified: now.toISOString(),
      eTag: "",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

export const createManualDatabaseBackup = async (options = {}) => {
  if (manualBackupInFlight) {
    throw new DatabaseBackupError("已有数据库备份任务正在执行", 409);
  }

  manualBackupInFlight = createManualDatabaseBackupInternal(options);

  try {
    return await manualBackupInFlight;
  } finally {
    manualBackupInFlight = null;
  }
};

export const createDatabaseBackupDownloadUrl = async (key, {
  processEnv = process.env,
  commandEnv = process.env,
  expiresInSeconds = DOWNLOAD_EXPIRES_SECONDS,
  now = new Date(),
} = {}) => {
  const config = resolveDatabaseBackupConfig(processEnv);
  const normalizedKey = nonEmpty(key);

  if (!backupKeyAllowed(normalizedKey, config)) {
    throw new DatabaseBackupError("备份文件 key 不合法", 400);
  }

  await runAwsCli(config, [
    "s3api",
    "head-object",
    "--bucket",
    config.r2Bucket,
    "--key",
    normalizedKey,
  ], { commandEnv });

  const url = (await runAwsCli(config, [
    "s3",
    "presign",
    `s3://${config.r2Bucket}/${normalizedKey}`,
    "--expires-in",
    String(expiresInSeconds),
  ], { commandEnv })).trim();

  return {
    key: normalizedKey,
    url,
    expiresInSeconds,
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
  };
};
