FROM node:alpine AS builder

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "tsconfig.json", "tsconfig.module.json", "./"]
COPY ./src ./src
RUN npm ci --quiet && npm run build:main

FROM node:alpine

WORKDIR /app
ENV NODE_ENV=production

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
COPY ["data", "./data"]

RUN npm ci --quiet --only=production 

COPY --from=builder /usr/src/app/build ./build

CMD [ "npm", "start" ]