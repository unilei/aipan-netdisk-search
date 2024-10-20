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
ARG SHADOW_DATABASE_URL
 
# 将构建时的变量设置为环境变量
ENV ADMIN_USER=${ADMIN_USER}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_SCHEMA=${DATABASE_SCHEMA}
ENV SHADOW_DATABASE_URL=${SHADOW_DATABASE_URL}
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

run echo ${ADMIN_USER}
run echo ${ADMIN_PASSWORD}
run echo ${ADMIN_EMAIL}
run echo ${JWT_SECRET}
run echo ${DATABASE_URL}
run echo ${DATABASE_SCHEMA}
run echo ${SHADOW_DATABASE_URL}

# RUN npm install
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start" ]
