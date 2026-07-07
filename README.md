# Kasaly

Kasaly is a shared home management hub for couples, families, and roommates: one place to track the shopping list, tasks, notes, calendar events, and useful links for a household.

## Product overview

A household signs up, creates (or joins) a household during onboarding, and gets a shared dashboard with widgets for each area of daily life. Everyone in the household shares the same persisted data through Supabase.

## Main features

- **Auth** — email/password signup and login (Supabase Auth, email confirmation required)
- **Onboarding** — create a household and become its first admin member
- **Dashboard** — overview of the household with per-feature widgets
- **Shopping list** — shared, persisted shopping items
- **Tasks** — shared household to-dos
- **Notes** — categorized shared notes
- **Useful links** — shared bookmarks for the household
- **Agenda** — shared calendar/events, ordered by date
- **Profile** — household member profile (name, initial, color); an admin
  can also rename the household
- **Member invitations** — an admin generates a copyable invite link from
  Profile; no automatic email sending in V1

All of the above are implemented and backed by Supabase (see [V1 status](#roadmap--v1-status)).

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, CSS variables design tokens
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Deployment:** Vercel
- **CI:** GitHub Actions (lint + build)

## Repository structure

```
casahub/
├── apps/
│   └── web/                  # Next.js app — the actual product (see below)
├── packages/
│   └── shared/                # Placeholder for future shared types/schemas/utils
├── supabase/
│   ├── schema.sql              # Tables + RLS policies
│   ├── grants.sql               # Table-level privileges for `authenticated`
│   ├── household-rpc.sql         # create_household_with_member RPC
│   └── household-invitations.sql # Invitation table + create/accept RPCs
├── docs/
│   ├── data-model.md          # Entity/column reference for the Supabase schema
│   ├── deployment.md          # Vercel setup, env vars, Node version
│   ├── qa-v1.md               # Manual QA + deployment readiness checklists
│   └── design/                # Design tokens, handoff spec, reference screenshots
├── .github/workflows/ci.yml   # Lint + build on every push/PR to main
└── AGENTS.md                  # Contribution workflow & constraints for contributors/agents
```

`apps/web` is a self-contained Next.js app with its own `package.json` and lockfile — this is **not** an npm-workspaces monorepo. The root `package.json` only proxies scripts into `apps/web`.

```
apps/web/src/
├── app/          # Routes, layout, global CSS (App Router)
├── features/     # auth, onboarding, dashboard, shopping, tasks, notes, links, agenda, profile
├── components/
│   └── ui/       # Shared primitives: Button, Card, Input, Badge, Avatar
└── lib/          # Utilities and the Supabase client
```

## Prerequisites

- Node.js v18+ (CI runs on Node 24 — see [docs/deployment.md](docs/deployment.md))
- npm v9+
- A Supabase project (see [Supabase setup](#supabase-setup))

## Local setup

```bash
git clone https://github.com/matchls/casahub.git
cd casahub
cd apps/web && npm install
```

Copy the env file and fill in your Supabase project values:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Run the dev server from the repository root:

```bash
npm run dev
```

Or from `apps/web` directly (`npm install` must have been run there first):

```bash
cd apps/web
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Environment variables

Set these in `apps/web/.env.local` for local dev, and in Vercel → Project Settings → Environment Variables for deployed environments. Both are safe to expose to the browser (public/anon keys, protected by Row Level Security).

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

**Never** put the Supabase `service_role` / secret key in this repo, in `.env.local`, or in Vercel. No frontend code in this project needs it — see [Security notes](#security-notes).

## Available scripts

Run from the repository root (each proxies into `apps/web`):

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

Equivalent commands also work from `apps/web` directly (e.g. `npm run start` to serve a production build after `npm run build`).

## Supabase setup

Apply the SQL files in order via the Supabase SQL Editor on a fresh project:

1. [`supabase/schema.sql`](supabase/schema.sql) — tables and Row Level Security (RLS) policies. RLS is enabled on every table (`households`, `household_members`, `shopping_items`, `tasks`, `events`, `notes`, `useful_links`); access is scoped per household member.
2. [`supabase/grants.sql`](supabase/grants.sql) — table-level `GRANT`s for the `authenticated` role (required in addition to RLS).
3. [`supabase/household-rpc.sql`](supabase/household-rpc.sql) — `create_household_with_member` RPC used by onboarding to atomically create a household and its first admin member. Also drops the legacy direct-INSERT policy on `households`, so re-running it on an existing project applies the hardening from issue #61.
4. [`supabase/household-invitations.sql`](supabase/household-invitations.sql) — `household_invitations` table (RLS enabled, no direct-access policies) plus the `create_household_invitation` / `get_household_invitation` / `accept_household_invitation` RPCs used by the member invitation flow.

See [docs/data-model.md](docs/data-model.md) for the entity/column reference.

The app only ever uses the **publishable (anon) key** on the frontend — never the `service_role` key (see [Security notes](#security-notes)).

## Development workflow

Full contributor/agent instructions — branch naming, project constraints, design handoff references — live in [AGENTS.md](AGENTS.md). Summary of the day-to-day loop:

1. Start from an up-to-date `main`.
2. Work on a dedicated branch per issue.
3. Run `npm run lint` and `npm run build` before requesting review.
4. Open a PR, wait for CI, merge, then clean up the branch.

### Branch / PR workflow

- **One issue → one branch → one PR.**
- Branch naming: `type/issue-number-short-description` (e.g. `docs/45-professional-readme`).
- PR title: short, imperative, prefixed by type (`feat:`, `fix:`, `docs:`, `chore:`…).
- PR description includes `Closes #<issue-number>`.
- After merge: delete the remote and local branch.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and PR to `main`: install (`npm ci`), lint, and build, all `working-directory: apps/web` on Node 24. Both lint and build must pass before merging.

## Deployment

Deployed to Vercel with **Root Directory** set to `apps/web`. Full setup steps, required environment variables, and Supabase Auth redirect URL configuration are documented in [docs/deployment.md](docs/deployment.md).

## QA

Manual QA and deployment-readiness checklists live in [docs/qa-v1.md](docs/qa-v1.md), including a known limitation around Supabase email confirmation blocking fresh-signup login testing.

## Roadmap / V1 status

All core features are implemented and connected to Supabase: auth, onboarding, dashboard, shopping list, tasks, notes, useful links, and agenda. Remaining V1 work is deployment/QA hardening — see the checklists in [docs/qa-v1.md](docs/qa-v1.md).

## Security notes

- Row Level Security is enabled on every table; policies scope reads/writes to a user's own household (see [`supabase/schema.sql`](supabase/schema.sql)).
- Households can only be created through the `create_household_with_member` RPC ([`supabase/household-rpc.sql`](supabase/household-rpc.sql)), which atomically creates the household and its first admin member. There is no RLS policy allowing a direct `INSERT` into `households` from an authenticated client, preventing orphan households with no admin member.
- `household_invitations` ([`supabase/household-invitations.sql`](supabase/household-invitations.sql)) has RLS enabled with **no** SELECT/INSERT/UPDATE/DELETE policies at all — every read and write goes through its `SECURITY DEFINER` RPCs, which enforce admin-only invite creation, expiry/one-time-use on acceptance, and the one-household-per-user rule server-side.
- The frontend uses only the Supabase **publishable/anon key**. The `service_role` key must never be added to this repo, `.env.local`, or Vercel.
- Don't commit `.env.local` or any file containing real Supabase credentials.

## Useful documentation links

- [AGENTS.md](AGENTS.md) — contribution workflow, project constraints, design handoff references
- [docs/data-model.md](docs/data-model.md) — Supabase schema reference
- [docs/deployment.md](docs/deployment.md) — Vercel deployment guide
- [docs/qa-v1.md](docs/qa-v1.md) — manual QA and deployment readiness checklists
- [docs/design/](docs/design/) — design tokens and handoff spec
