# 构建阶段
FROM node:20.19.2-alpine AS builder
LABEL authors="Lei"

# 设置工作目录
WORKDIR /app

# 设置 Node.js 内存限制
ENV NODE_OPTIONS="--max-old-space-size=8192"

# 安装系统依赖（canvas包编译所需）
RUN apk add --no-cache \
  python3 \
  py3-pip \
  make \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  musl-dev \
  giflib-dev \
  pixman-dev \
  pangomm-dev \
  libjpeg-turbo-dev \
  freetype-dev \
  fontconfig-dev \
  ttf-dejavu

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
  find . -maxdepth 1 ! -name '.output' ! -name 'generated' ! -name 'prisma' ! -name 'ecosystem.config.js' ! -name '.' -exec rm -rf {} +

# 生产阶段
FROM node:20.19.2-alpine
LABEL authors="Lei"

# 安装 Canvas 运行时依赖
RUN apk add --no-cache \
  cairo \
  jpeg \
  pango \
  giflib \
  pixman \
  libjpeg-turbo \
  freetype \
  fontconfig \
  ttf-dejavu

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma 
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# 安装 PM2 和 Prisma CLI，供运行时和迁移容器使用
RUN npm install -g pm2 prisma

# 设置环境变量
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV WS_PORT=3002
ENV NUXT_PUBLIC_WS_PORT=3002

# 暴露端口
EXPOSE 3000
EXPOSE 3002

# 使用 PM2 以 production 配置启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
