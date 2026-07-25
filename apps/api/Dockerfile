# syntax=docker/dockerfile:1

# Debian-based (not alpine) so Prisma's default query engine binary target
# (debian-openssl-3.0.x) works with no binaryTargets override in schema.prisma.
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN npm install -g turbo@2.3.3

# ---- Prune the monorepo down to what @anontalk/api actually needs ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @anontalk/api --docker

# ---- Install deps for the pruned subset ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ---- Build (prisma client + nest build) ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm --filter @anontalk/api exec prisma generate
RUN turbo run build --filter=@anontalk/api

# ---- Runtime ----
FROM node:22-bookworm-slim AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

RUN chmod +x /app/apps/api/docker-entrypoint.sh

USER nestjs
WORKDIR /app/apps/api
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
