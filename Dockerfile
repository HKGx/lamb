
FROM node:16-alpine as build
COPY ["package.json", "package-lock.json", "npm-shrinkwrap.json*", "tsconfig.json", "tsconfig.module.json", "app/"]
WORKDIR /app/
RUN npm ci -q
FROM build as prod
COPY src/ ./src
COPY data/ ./data
ENV NODE_ENV=production
CMD ["npm", "start"]