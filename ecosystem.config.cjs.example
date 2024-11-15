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
        ADMIN_USER: "",
        ADMIN_PASSWORD: "",
        ADMIN_EMAIL: "",
        JWT_SECRET: "",
        DATABASE_SCHEMA: "",
        DATABASE_URL: "",
        SHADOW_DATABASE_URL: "",
      },
    },
  ],
};
