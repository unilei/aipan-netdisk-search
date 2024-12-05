module.exports = {
  apps: [
    {
      name: "aipan-netdisk-search",
      port: "3000",
      exec_mode: "cluster",
      instances: "max",
      script: "./.output/server/index.mjs",
      watch: true,
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
        NUXT_PUBLIC_GITHUB_OWNER: process.env.NUXT_PUBLIC_GITHUB_OWNER,
        NUXT_PUBLIC_GITHUB_REPO: process.env.NUXT_PUBLIC_GITHUB_REPO,
        NUXT_PUBLIC_GITHUB_TOKEN: process.env.NUXT_PUBLIC_GITHUB_TOKEN,
        NUXT_PUBLIC_GITHUB_BRANCH: process.env.NUXT_PUBLIC_GITHUB_BRANCH
      },
    },
  ],
};
