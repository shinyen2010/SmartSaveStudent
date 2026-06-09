# SmartSave Student

An AI-powered personal finance platform for students — track expenses, manage budgets, achieve savings goals, and build healthy money habits through smart insights and gamification.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/smartsave run dev` — run the frontend (port 21566, preview at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Recharts, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle ORM table definitions (expenses, budgets, goals, challenges, achievements)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/smartsave/src/pages/` — React page components
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec drives all types — never hand-write what codegen already produces.
- Dashboard endpoints compute derived metrics (health score, forecast, alerts) server-side for simplicity.
- Budget spend is calculated dynamically by joining expenses to budgets — no denormalized spend counter.
- Achievements and XP are seeded statically and unlocked manually for now (no event system in MVP).

## Product

**MVP features live:**
- Expense Tracking — add/edit/delete expenses with category, mood, date
- Smart Budget Planner — category budgets with live spend tracking and over-budget alerts
- Savings Goals — create goals, contribute funds, track progress
- Savings Challenges — gamified money challenges with XP rewards
- Achievement System — unlockable badges with XP
- Spending Insights Dashboard — monthly trend charts, category breakdown, comparisons
- Financial Health Score — 0–100 score with grade, broken down by savings rate, budget adherence, goal achievement
- Smart Alerts — proactive budget threshold warnings
- Spending Forecast — end-of-month projection with risk level

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before touching route handlers
- Budget spend is calculated live via SQL JOIN — no manual sync needed when adding expenses
- The API server must be restarted after `pnpm run build` for route changes to take effect

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
