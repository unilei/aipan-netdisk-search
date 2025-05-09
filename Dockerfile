# 构建阶段
FROM node:20.18.0-alpine AS builder
LABEL authors="Lei"

# 设置工作目录
WORKDIR /app

# 设置 Node.js 内存限制
ENV NODE_OPTIONS="--max-old-space-size=8192"

# 复制 package.json  
COPY package.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置构建时数据库连接（仅用于构建阶段）
# 注意：这里的 prisma generate 是为了确保 Nuxt 构建正确运行
# 在生产阶段我们会再次生成客户端，确保与运行环境兼容
ARG DATABASE_URL="postgresql://postgres:postgres@postgres:5432/aipan?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate

# 构建项目
RUN npm run build

# 清理不需要的文件和目录但确保关键文件存在
RUN rm -rf node_modules && \
  rm -rf dist && \
  rm -rf .git && \
  rm -rf .nuxt && \
  find . -maxdepth 1 ! -name '.output' ! -name 'prisma-esm-fix.mjs' ! -name 'generated' ! -name 'prisma' ! -name 'ecosystem.config.js' ! -name '.' -exec rm -rf {} + && \
  # 确保 prisma-esm-fix.mjs 文件存在 
  if [ ! -f ./prisma-esm-fix.mjs ]; then \
  echo 'Creating prisma-esm-fix.mjs file in builder stage...' && \
  echo "import { fileURLToPath } from 'url'; import { dirname } from 'path'; import { createRequire } from 'module'; if (typeof global.__filename === 'undefined') { global.__filename = fileURLToPath(import.meta.url); } if (typeof global.__dirname === 'undefined') { global.__dirname = dirname(global.__filename); } if (typeof global.require === 'undefined') { global.require = createRequire(import.meta.url); } console.log('[Prisma ESM Fix] 已加载 ES Module 环境修复');" > ./prisma-esm-fix.mjs; \
  fi

# 生产阶段
FROM node:20.18.0-alpine
LABEL authors="Lei"

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma 
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# 复制 prisma-esm-fix.mjs 或在需要时创建它
RUN if [ -f /app/prisma-esm-fix.mjs ]; then \
  cp /app/prisma-esm-fix.mjs ./prisma-esm-fix.mjs; \
  else \
  echo 'Creating prisma-esm-fix.mjs file in production stage...' && \
  echo "import { fileURLToPath } from 'url'; import { dirname } from 'path'; import { createRequire } from 'module'; if (typeof global.__filename === 'undefined') { global.__filename = fileURLToPath(import.meta.url); } if (typeof global.__dirname === 'undefined') { global.__dirname = dirname(global.__filename); } if (typeof global.require === 'undefined') { global.require = createRequire(import.meta.url); } console.log('[Prisma ESM Fix] 已加载 ES Module 环境修复');" > ./prisma-esm-fix.mjs; \
  fi

# 安装 Prisma 并生成客户端
RUN npm install -g prisma && \
  cd /app && \
  # 创建最小化的 package.json 来避免 Prisma 警告
  echo '{"name":"aipan-netdisk-search","version":"1.0.0","dependencies":{"@prisma/client":"^6.7.0","@prisma/adapter-pg":"^6.7.0","pg":"^8.15.6"}}' > minimal-package.json && \
  # 安装 Prisma 客户端并指定使用最小化的 package.json
  npx prisma generate && \
  # 删除临时生成的 package.json 和 node_modules
  rm minimal-package.json && \
  rm -rf node_modules

# 安装 PM2 和必要的依赖
RUN npm install pm2 -g

# 设置环境变量
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV WS_PORT=3002
ENV NUXT_PUBLIC_WS_PORT=3002

# 暴露端口
EXPOSE 3000
EXPOSE 3002

# 使用 PM2 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]