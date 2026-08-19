# Deployment (Vercel + Supabase)

## Vercel project setup

Kasaly's production application lives in `apps/web`. The repository root only proxies scripts into that directory.

Configure Vercel with:

1. Import `matchls/casahub`.
2. **Framework Preset:** Next.js.
3. **Root Directory:** `apps/web`.
4. Keep the Next.js defaults for install/build/output:
   - Install: `npm ci`
   - Build: `npm run build`
   - Output: managed by Vercel's Next.js builder
5. Use **Node.js 24** to match `.github/workflows/ci.yml`.

No `vercel.json` is required for the current setup.

## Required environment variables

Configure these for Production and Preview (and Development when useful):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL; public browser configuration. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key; public browser configuration. |

These are the only Supabase environment variables the frontend needs.

**Never add `SUPABASE_SERVICE_ROLE_KEY`, a Supabase secret key, or another privileged database credential to Vercel/public frontend configuration.** Household isolation and privileged mutations are enforced through RLS and narrowly scoped database RPCs.

For local development, copy `apps/web/.env.local.example` to `apps/web/.env.local` and provide the same two public values. Never commit `.env.local`.

## Supabase SQL setup

### Fresh project

Apply the migrations in the following order through the Supabase SQL Editor:

1. `supabase/schema.sql`
   - Core tables (`households`, `household_members`, shopping, tasks, events, notes, useful links)
   - Shared `handle_updated_at()` trigger helper
   - Membership/admin helpers and core RLS policies
2. `supabase/grants.sql`
   - Core table privileges for `authenticated`
3. `supabase/household-rpc.sql`
   - One-household-per-user unique index
   - Removes legacy direct household INSERT policy
   - `create_household_with_member`
4. `supabase/household-invitations.sql`
   - Invitation table with deny-by-default direct access
   - `create_household_invitation`, `get_household_invitation`, `accept_household_invitation`
5. `supabase/budget.sql`
   - `budget_categories`, `budget_entries`
   - Budget RLS and default-category seeding RPC
6. `supabase/budget_recurring_expenses.sql`
   - `budget_recurring_expenses`, `budget_recurring_expense_skips`
   - `budget_entries.recurring_expense_id`
   - Idempotent monthly materialization, single-occurrence deletion and concurrency safeguards
7. `supabase/budget_recurring_series_management.sql`
   - `budget_recurring_expenses.end_month`
   - Whole-series edit (`Ce mois et les suivants`) and stop (`Arrêter à partir de ce mois`)
8. `supabase/budget_shares.sql`
   - `households.budget_share_count`
   - `set_household_budget_share_count`
9. `supabase/budget_monthly_targets.sql`
   - `budget_monthly_targets`
   - Planned amount per main category and month

### Legacy corrective migration

`supabase/budget_recurring_series_management_fix.sql` is **not applied on a fresh database**.

It exists only for a database that had already received the earlier version of `budget_recurring_series_management.sql` before its two review fixes were folded back into that main migration. A fresh project only needs the nine files above.

Do not apply database migrations automatically from frontend code or a public Vercel environment. For normal Kasaly feature work, review the migration in the PR first, apply it manually in Supabase when required, verify it, and only then merge the application code that depends on it.

## Post-SQL verification

Before treating a Supabase project as ready:

- [ ] Core tables exist: `households`, `household_members`, `shopping_items`, `tasks`, `events`, `notes`, `useful_links`.
- [ ] `household_invitations` exists and direct authenticated CRUD is denied.
- [ ] Budget tables exist: `budget_categories`, `budget_entries`, `budget_recurring_expenses`, `budget_recurring_expense_skips`, `budget_monthly_targets`.
- [ ] `households.budget_share_count` exists.
- [ ] `budget_entries.recurring_expense_id` exists.
- [ ] `budget_recurring_expenses.end_month` exists.
- [ ] RLS is enabled on every household-scoped application table.
- [ ] `create_household_with_member` works and direct authenticated `INSERT` into `households` is rejected.
- [ ] Invitation RPCs exist and enforce admin creation, expiry/one-time-use, and the one-household-per-user rule.
- [ ] `ensure_default_budget_categories` exists.
- [ ] Recurrence RPCs exist, including `ensure_budget_recurring_occurrences`, occurrence deletion, series edit and series stop.
- [ ] `set_household_budget_share_count` exists.
- [ ] Monthly targets can only reference a main category belonging to the same household.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` or equivalent privileged key is present in Vercel or committed env files.

## Supabase Auth redirect URLs

Supabase email confirmation is enabled for the current project. Configure Authentication → URL Configuration using the real deployed domains.

Typical production setup:

- **Site URL:** `https://kasaly.vercel.app`
- **Redirect URLs:** include the production domain pattern required for confirmation flows, and only add Preview URLs when confirmation must be tested on PR previews.

The app's `next=` parameter is application routing, not a Supabase redirect setting. Login/signup sanitize and preserve the intended internal path where possible.

### Invite flow

`/invite/[token]` is guest-accessible. A signed-out visitor can choose login/signup and return to the invite path after authentication.

With email confirmation enabled, a brand-new signup has no immediate session. The tester must confirm the email and then return to the invite link (or log in with that path as `next`) before accepting the invitation.

See [qa-v1.md](qa-v1.md) for the end-to-end invitation test.

## CI and deployment readiness

GitHub Actions runs from `apps/web` and must pass:

```bash
npm run lint
npm run build
```

For functional or visual changes, CI is necessary but not sufficient: use Vercel Preview for human QA before merge when relevant.

For a migration-dependent PR, the safe order is:

1. Review the exact PR code and SQL.
2. Validate CI.
3. Apply the required migration manually in Supabase.
4. Perform migration/application QA.
5. Re-check the exact PR head.
6. Merge manually.
7. Verify the production deployment.

## Security reminders

- Keep the Vercel Root Directory on `apps/web`.
- Keep frontend env configuration limited to the two public `NEXT_PUBLIC_SUPABASE_*` variables.
- RLS is part of the application's security boundary; do not replace it with client-side filtering.
- `SECURITY DEFINER` RPCs must stay narrowly scoped, validate the caller/household explicitly, and set a safe `search_path`.
- Never expose a Supabase service-role/secret key to the browser.
