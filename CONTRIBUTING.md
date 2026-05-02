# Contributing to Agent Bridge

Thanks for your interest in contributing!

## Setup

```bash
git clone https://github.com/florextech/agent-bridge.git
cd agent-bridge
cp .env.example .env
docker compose up db -d
pnpm install
cd apps/api && npx prisma db push && cd ../..
pnpm -r build
```

## Development

```bash
pnpm dev:api    # API on :3001
pnpm dev:web    # Web on :3000
```

## Tests

```bash
pnpm test                        # Unit tests (vitest)
cd apps/web && pnpm test:e2e     # E2E tests (playwright)
```

## Code Style

- TypeScript strict — no `any`
- Use `@florexlabs/ui` components
- Tailwind CSS v4 with FLX design tokens
- Phosphor Icons (duotone weight)
- Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Pull Requests

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `pnpm -r build && pnpm test`
5. Commit with conventional commits
6. Push and open a PR

## Project Structure

```
apps/api          NestJS + Prisma + PostgreSQL
apps/web          Next.js + @florexlabs/ui
packages/core     Shared types and interfaces
packages/sdk      TypeScript client
packages/mcp      MCP server for agent integration
```
