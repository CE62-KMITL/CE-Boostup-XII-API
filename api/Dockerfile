FROM node:20-alpine AS base

RUN npm i -g pnpm@9.15.2


FROM base AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
RUN pnpm prune --prod


FROM base AS deploy

RUN apk add --update --no-cache curl

WORKDIR /app
COPY --chown=node:node logo.avif logo.avif
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node .env .env

USER node

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
