# Build context must be the monorepo root:
#   docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

# Next.js inlines NEXT_PUBLIC_* env vars into the browser bundle at BUILD
# time (next build below), not at container-start time — so this MUST be a
# build ARG, set BEFORE `next build` runs. A runtime-only `docker run -e`
# or compose `environment:` entry is too late and ships an empty API URL.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY pnpm-lock.yaml* ./
RUN pnpm install --filter ./apps/web... --no-frozen-lockfile

COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter ./apps/web build

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /repo/apps/web
CMD ["pnpm", "start"]
