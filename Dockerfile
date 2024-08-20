FROM node:18-alpine

LABEL authors="Lei"

WORKDIR /app

COPY . .

# 定义构建时的变量
ARG ADMIN_USER
ARG ADMIN_PASSWORD
ARG ADMIN_EMAIL
ARG JWT_SECRET
ARG DATABASE_URL

# 将构建时的变量设置为环境变量
ENV ADMIN_USER=${ADMIN_USER}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

# 使用淘宝 npm 镜像
RUN npm config set registry https://registry.npmmirror.com

RUN npm install
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# Set NuxtJS system variables so the application can be reached on your network
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

WORKDIR /app

EXPOSE 3000

CMD [ "npm", "run", "start" ]
