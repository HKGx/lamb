FROM node:alpine as base
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "tsconfig.json", "tsconfig.module.json", "./"]

FROM base AS dev
COPY ./src ./src
RUN npm ci --quiet && npm run build:main

FROM base as prod

WORKDIR /app
ENV NODE_ENV=production

COPY ["data", "./data"]

RUN npm ci --quiet --only=production 

COPY --from=dev /usr/src/app/build ./build

CMD ["npm", "start"]