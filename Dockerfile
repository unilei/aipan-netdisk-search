FROM ubuntu:latest
LABEL authors="Lei"

FROM node:18.17.1-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm run build

COPY . .

EXPOSE 3000

# Set NuxtJS system variables so the application can be reached on your network
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD [ "npm", "run", "start" ]
