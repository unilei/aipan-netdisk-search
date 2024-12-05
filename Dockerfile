# 构建阶段
FROM node:20.18.0-alpine AS builder
LABEL authors="Lei"

# 设置工作目录
WORKDIR /app

# 设置 Node.js 内存限制
ENV NODE_OPTIONS="--max-old-space-size=8192"

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建项目
RUN npm run build

# 清理不需要的文件和目录
RUN rm -rf node_modules && \
    rm -rf dist && \
    rm -rf .git && \
    rm -rf .nuxt && \
    find . -maxdepth 1 ! -name '.output' ! -name 'prisma' ! -name 'ecosystem.config.js' ! -name '.' -exec rm -rf {} +

# 生产阶段
FROM node:20.18.0-alpine
LABEL authors="Lei"

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma 
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# 安装 PM2
RUN npm install pm2 -g

# 设置环境变量
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# 暴露端口
EXPOSE 3000

# 使用 PM2 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]