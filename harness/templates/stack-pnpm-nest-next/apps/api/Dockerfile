# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY pnpm-lock.yaml* ./
RUN pnpm install --filter ./apps/api... --no-frozen-lockfile

COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter ./apps/api exec prisma generate \
  && pnpm --filter ./apps/api build

ENV NODE_ENV=production
EXPOSE 3001
WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
