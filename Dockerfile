FROM node:18-alpine

LABEL authors="Lei"

WORKDIR /app

#  安装pnmp
RUN npm install -g pnpm

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 使用 pnpm 安装依赖
RUN pnpm install

COPY . .

# 定义构建时的变量
ARG ADMIN_USER
ARG ADMIN_PASSWORD
ARG ADMIN_EMAIL
ARG JWT_SECRET
ARG DATABASE_URL
ARG DATABASE_SCHEMA

# 将构建时的变量设置为环境变量
ENV ADMIN_USER=${ADMIN_USER}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_SCHEMA=${DATABASE_SCHEMA}

RUN echo $DATABASE_URL

# RUN npm install
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# Set NuxtJS system variables so the application can be reached on your network
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

WORKDIR /app

EXPOSE 3000

CMD [ "npm", "run", "start" ]
