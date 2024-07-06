FROM node:18-alpine

LABEL authors="Lei"

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Set NuxtJS system variables so the application can be reached on your network
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

WORKDIR /app

EXPOSE 3000

CMD [ "npm", "run", "start" ]
