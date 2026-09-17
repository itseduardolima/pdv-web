FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @pdv/shared build \
 && pnpm --filter api db:generate \
 && pnpm --filter api build \
 && pnpm --filter api --prod deploy --legacy /out

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["sh", "-c", "npx --no-install prisma generate && npx --no-install prisma migrate deploy && node dist/main.js"]
