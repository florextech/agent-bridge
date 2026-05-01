FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/core/package.json packages/core/
COPY packages/sdk/package.json packages/sdk/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @agent-bridge/core build && \
    cd apps/api && npx prisma generate && \
    pnpm --filter @agent-bridge/api build

FROM base AS runner
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/core/package.json ./packages/core/
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
