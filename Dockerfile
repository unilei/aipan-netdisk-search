FROM node:alpine AS builder

WORKDIR /app

ADD . .

RUN npm install -g pnpm
RUN pnpm install && pnpm build

WORKDIR /app

CMD pnpm run dev

EXPOSE 3001
