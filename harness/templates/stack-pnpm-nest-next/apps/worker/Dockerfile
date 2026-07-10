# Build context must be the monorepo root:
#   docker build -f apps/worker/Dockerfile .
FROM node:22-alpine AS build
RUN apk add --no-cache ffmpeg
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/
COPY packages/queue-core/package.json packages/queue-core/
COPY packages/storage-core/package.json packages/storage-core/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY pnpm-lock.yaml* ./
RUN pnpm install --filter ./apps/worker... --no-frozen-lockfile

COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm --filter ./apps/worker build

ENV NODE_ENV=production
WORKDIR /repo/apps/worker
CMD ["node", "dist/main.js"]
