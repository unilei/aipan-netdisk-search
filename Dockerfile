# 第一阶段：构建阶段
FROM node:18-alpine AS builder
LABEL authors="Lei"

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml（或 package-lock.json，如果有）
COPY package*.json ./

# 安装仅用于构建的依赖
RUN pnpm install

# 复制所有项目文件
COPY . .

ENV NODE_ENV=production
# 定义构建时的变量
ARG ADMIN_USER
ARG ADMIN_PASSWORD
ARG ADMIN_EMAIL
ARG JWT_SECRET
ARG DATABASE_URL
ARG DATABASE_SCHEMA
ARG SHADOW_DATABASE_URL

# 设置环境变量
ENV ADMIN_USER=${ADMIN_USER}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_SCHEMA=${DATABASE_SCHEMA}
ENV SHADOW_DATABASE_URL=${SHADOW_DATABASE_URL}
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 生成 Prisma 客户端和数据库迁移
RUN npx prisma generate
RUN npx prisma migrate deploy

# 构建 Nuxt.js 项目
RUN npm run build

# 第二阶段：运行阶段
FROM node:18-alpine
LABEL authors="Lei"

# 设置工作目录
WORKDIR /app

# 复制构建后的项目文件
COPY --from=builder /app/.output .output
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json

# 设置环境变量
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# 暴露端口
EXPOSE 3000

# 启动 Nuxt.js 应用
CMD ["node", ".output/server/index.mjs"]