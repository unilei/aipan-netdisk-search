const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const webConcurrency = parsePositiveInteger(process.env.WEB_CONCURRENCY, 2);
const nodeMaxOldSpaceSizeMb = parsePositiveInteger(
  process.env.NODE_MAX_OLD_SPACE_SIZE_MB,
  320,
);
const maxMemoryRestart = process.env.PM2_MAX_MEMORY_RESTART || "384M";

module.exports = {
  apps: [
    {
      name: "aipan-netdisk-search",
      port: "3000",
      exec_mode: "cluster",
      instances: webConcurrency,
      script: "./.output/server/index.mjs",
      node_args: [`--max-old-space-size=${nodeMaxOldSpaceSizeMb}`],
      max_memory_restart: maxMemoryRestart,
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ADMIN_USER: process.env.ADMIN_USER,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_SCHEMA: process.env.DATABASE_SCHEMA,
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_USER: process.env.POSTGRES_USER,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
        POSTGRES_DB: process.env.POSTGRES_DB,
        REDIS_URL: process.env.REDIS_URL,
        DB_BACKUP_RETENTION: process.env.DB_BACKUP_RETENTION,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET: process.env.R2_BUCKET,
        R2_PREFIX: process.env.R2_PREFIX,
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        WS_PORT: process.env.WS_PORT,
        NUXT_PUBLIC_WS_PORT: process.env.NUXT_PUBLIC_WS_PORT,
        NUXT_PUBLIC_GITHUB_OWNER: process.env.NUXT_PUBLIC_GITHUB_OWNER,
        NUXT_PUBLIC_GITHUB_REPO: process.env.NUXT_PUBLIC_GITHUB_REPO,
        NUXT_GITHUB_TOKEN: process.env.NUXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
        NUXT_PUBLIC_GITHUB_BRANCH: process.env.NUXT_PUBLIC_GITHUB_BRANCH,
        NUXT_QUARK_COOKIE: process.env.NUXT_PUBLIC_QUARK_COOKIE || process.env.QUARK_COOKIE,
      },
    },
  ],
};
