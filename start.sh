#!/bin/sh

# 检查必要的环境变量是否已设置
: "${ADMIN_PASSWORD:?Need to set ADMIN_PASSWORD}"
: "${ADMIN_EMAIL:?Need to set ADMIN_EMAIL}"
: "${JWT_SECRET:?Need to set JWT_SECRET}"
: "${DATABASE_URL:?Need to set DATABASE_URL}"
: "${DATABASE_SCHEMA:?Need to set DATABASE_SCHEMA}"

echo "Running database migrations..."
# 执行数据库迁移，并指定 schema 文件的位置
npx prisma migrate deploy --schema=/app/prisma/schema.prisma

echo "Starting application..."
# 启动 Nuxt.js 应用
exec node .output/server/index.mjs