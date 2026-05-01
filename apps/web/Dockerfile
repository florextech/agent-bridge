FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/core/package.json packages/core/
COPY packages/sdk/package.json packages/sdk/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @agent-bridge/core build && \
    pnpm --filter @agent-bridge/web build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./.next/static
COPY --from=build /app/apps/web/public ./public 2>/dev/null || true
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
