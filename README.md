# Kasaly

Kasaly is a shared home management hub for couples, families, and roommates. It centralizes day-to-day household information and actions in one Supabase-backed application.

## Main features

- **Auth** — email/password signup and login with Supabase Auth.
- **Onboarding** — create a household and become its first admin member.
- **Dashboard** — shared overview of the household.
- **Shopping list** — shared persisted items with edit/delete flows.
- **Tasks** — shared household to-dos.
- **Notes** — categorized shared notes.
- **Useful links** — shared household bookmarks.
- **Agenda** — shared calendar/events.
- **Profile** — member identity and admin household-name editing.
- **Member invitations** — admin-generated copyable invite links.
- **Budget** — category/subcategory expenses, fixed/variable classification, one-off or monthly recurrence, 6-month evolution, per-person shares, recurring-series management, and monthly planned targets versus actual spending.

All household data is persisted in Supabase and scoped by Row Level Security (RLS).

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase Auth + Postgres + RLS
- **Deployment:** Vercel
- **CI:** GitHub Actions (`lint` + `build`)

## Repository structure

```text
casahub/
├── apps/
│   └── web/                              # Next.js application (Vercel root)
├── packages/
│   └── shared/                           # Reserved shared package
├── supabase/
│   ├── schema.sql                        # Core household tables + RLS helpers/policies
│   ├── grants.sql                        # Core authenticated table grants
│   ├── household-rpc.sql                 # Atomic household creation + one-household-per-user guard
│   ├── household-invitations.sql         # Invitation table + RPC-only access
│   ├── budget.sql                        # Budget categories + entries
│   ├── budget_recurring_expenses.sql     # Monthly recurring templates, skips and occurrence generation
│   ├── budget_recurring_series_management.sql # Edit/stop recurring series
│   ├── budget_recurring_series_management_fix.sql # Legacy corrective migration only
│   ├── budget_shares.sql                 # Configurable Budget share count
│   └── budget_monthly_targets.sql        # Planned amount per main category/month
├── docs/
│   ├── data-model.md                     # Current persisted Supabase model
│   ├── deployment.md                     # Vercel + Supabase setup
│   ├── qa-v1.md                          # Manual V1 regression checklist
│   └── design/
├── .github/workflows/ci.yml
└── AGENTS.md
```

`apps/web` is a self-contained Next.js app with its own `package.json` and lockfile. The repository is not configured as an npm-workspaces monorepo.

## Local setup

```bash
git clone https://github.com/matchls/casahub.git
cd casahub/apps/web
npm install
cp .env.local.example .env.local
npm run dev
```

The application is then available at `http://localhost:3000`.

## Environment variables

Only these public Supabase values are required by the application:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key |

**Never add `SUPABASE_SERVICE_ROLE_KEY` (or another Supabase secret/service-role key) to frontend code, `.env.local`, or public Vercel configuration.** The application is designed to use the publishable key together with RLS and narrowly scoped RPCs.

## Available scripts

Run from `apps/web`:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

The root package also proxies the main scripts into `apps/web`.

## Supabase setup

### Fresh project

Apply the SQL files in this order in the Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/grants.sql`
3. `supabase/household-rpc.sql`
4. `supabase/household-invitations.sql`
5. `supabase/budget.sql`
6. `supabase/budget_recurring_expenses.sql`
7. `supabase/budget_recurring_series_management.sql`
8. `supabase/budget_shares.sql`
9. `supabase/budget_monthly_targets.sql`

`budget_recurring_series_management_fix.sql` is **not part of a fresh setup**. It exists only as the corrective migration for an already-provisioned database that received the earlier faulty version of `budget_recurring_series_management.sql`. The current main migration already contains the corrected implementation.

See [docs/deployment.md](docs/deployment.md) for the complete post-SQL verification checklist and [docs/data-model.md](docs/data-model.md) for the current data model.

## Development workflow

Contributor/agent constraints live in [AGENTS.md](AGENTS.md). The project follows:

1. Start from an up-to-date `main`.
2. One issue → one dedicated branch → one PR.
3. Keep scope limited to the issue.
4. Run `npm run lint` and `npm run build` from `apps/web`.
5. Review the exact PR head before merge.
6. Keep manual human QA for functional/visual changes.
7. Never merge automatically.

For schema changes, migrations are reviewed in code first and then applied manually to Supabase before merge when the application depends on them.

## CI

`.github/workflows/ci.yml` runs install, lint and production build for pushes/PRs targeting `main`, using `apps/web` as the working directory.

## Deployment

Kasaly is deployed on Vercel with:

- **Root Directory:** `apps/web`
- **Framework:** Next.js
- **Environment variables:** only the two `NEXT_PUBLIC_SUPABASE_*` values listed above

See [docs/deployment.md](docs/deployment.md).

## QA / V1 status

The core V1 feature set is implemented. Current priority is **stabilization**: real-use QA, mobile behavior, state/error handling, cross-household permissions/RLS checks, and regression fixes rather than large new Budget features.

The manual release checklist is in [docs/qa-v1.md](docs/qa-v1.md), including dedicated Budget recurrence/targets/share tests.

## Security notes

- RLS is enabled on all household-scoped application tables.
- Direct household creation is blocked; `create_household_with_member` creates the household and its first admin atomically.
- A user is limited to one household by a database unique index on `household_members.user_id`.
- `household_invitations` has RLS enabled with no direct table policies; invitation access goes through validated `SECURITY DEFINER` RPCs.
- Budget entries/categories/targets are household-scoped by RLS.
- Recurring-series mutations that require elevated writes are exposed only through narrowly scoped RPCs that validate membership and preserve series invariants.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser or public Vercel environment.

## Documentation

- [AGENTS.md](AGENTS.md) — contribution workflow and constraints
- [docs/data-model.md](docs/data-model.md) — current Supabase schema overview
- [docs/deployment.md](docs/deployment.md) — deployment and database provisioning
- [docs/qa-v1.md](docs/qa-v1.md) — manual regression/deployment readiness checklist
- [docs/design/](docs/design/) — design references
