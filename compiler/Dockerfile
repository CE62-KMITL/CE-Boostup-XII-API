FROM node:20-bookworm-slim AS base

RUN npm i -g pnpm@9.15.2


FROM base AS dependencies

RUN apt-get update && apt-get install --no-install-recommends -y git ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /
RUN git clone https://github.com/ioi/isolate.git --branch v2.0 --single-branch --depth 1 isolate-src

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS build

RUN apt-get update && apt-get install --no-install-recommends -y gcc make libc6-dev libcap-dev libsystemd-dev pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /isolate-src
COPY --from=dependencies /isolate-src .
RUN make isolate
RUN make install

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
RUN pnpm prune --prod


FROM base AS deploy

RUN apt-get update && apt-get install --no-install-recommends -y gcc g++ libc6-dev wget && rm -rf /var/lib/apt/lists/*

WORKDIR /
RUN mkdir -p /usr/local/etc
COPY --from=build /isolate-src/isolate-check-environment /usr/local/bin/isolate-check-environment
COPY --from=build /isolate-src/isolate-cg-keeper /usr/local/sbin/isolate-cg-keeper
COPY --from=build /isolate-src/isolate /usr/local/bin/isolate
RUN chmod 4755 /usr/local/bin/isolate
COPY isolate.conf /usr/local/etc/isolate
RUN chmod 644 /usr/local/etc/isolate

WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY ./.env .env

USER node

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
