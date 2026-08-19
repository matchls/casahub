# V1 manual QA checklist

Run this against a deployed or local build backed by a real Supabase project. These checks exercise real reads/writes, RLS and RPCs; lint/build alone do not validate UX.

> Supabase email confirmation is enabled on the current project. A brand-new signup has no session until the confirmation link is used. Keep at least one confirmed test account available, and use two accounts when testing invitations/shared state.

## Auth and onboarding

- [ ] **Signup** — create a new account; confirmation message is shown without a crash/unhandled error.
- [ ] **Login** — confirmed account logs in and reaches the application.
- [ ] **Logout / persistence** — log out and back in; persisted household data is unchanged.
- [ ] **No household** — authenticated user without a household is redirected to `/onboarding`.
- [ ] **Create household** — onboarding creates one household plus one admin member atomically and lands on the dashboard.
- [ ] **Already in a household** — verify the app does not allow creating/joining a second household.

## Core feature walkthrough

- [ ] **Dashboard** — household profile, members and widgets load without errors.
- [ ] **Profile** — admin can rename the household; the new name persists after hard refresh.
- [ ] **Profile permissions** — non-admin cannot use the admin-only household edit control.
- [ ] **Shopping list** — add, edit, toggle and delete an item; hard refresh preserves the expected result.
- [ ] **Tasks** — add, edit, toggle and delete a task; hard refresh preserves the expected result.
- [ ] **Notes** — add/edit/delete notes across categories; grouping and persistence stay correct.
- [ ] **Useful links** — add/edit/delete a link; URL/title persist and delete does not accidentally navigate.
- [ ] **Agenda** — add/edit/delete an event; date/time/location persist and date edits move it to the correct group/order.

## Generic edit/delete/error behavior

- [ ] Cancelling an edit restores the previous value and performs no write.
- [ ] Required empty/invalid values are rejected with a clear message.
- [ ] Edit/delete controls do not trigger unrelated row actions (toggle, navigation, etc.).
- [ ] If an optimistic Supabase update/delete fails, UI state is rolled back instead of silently diverging from the database.
- [ ] Hard refresh after each CRUD flow matches the database state.

## Household invitation flow

Use two accounts.

- [ ] **Create invitation (admin)** — admin enters an email and receives a copyable link.
- [ ] **Create invitation (non-admin)** — non-admin has no usable invite control; direct `create_household_invitation` call fails.
- [ ] **Logged-out invite** — `/invite/<token>` shows login/signup actions rather than losing the token/path.
- [ ] **Login round trip** — login returns to the invite route.
- [ ] **Signup round trip** — after required email confirmation/login, returning to the invite route works.
- [ ] **Accept success** — invited account joins as `member`, lands in the household and sees shared data.
- [ ] **Already belongs elsewhere** — acceptance fails clearly and does not create a second membership.
- [ ] **Expired token** — clear expired state.
- [ ] **Already-used token** — clear already-used state.
- [ ] **Shared state** — both accounts see the same shopping/tasks/notes/links/agenda/Budget data after refresh.

## Budget — one-off expenses and totals

- [ ] Open Budget with a newly created household; default category tree is available exactly once (no duplicate categories after reload/concurrent opens).
- [ ] New expense defaults to **Ponctuelle**.
- [ ] Create a one-off fixed expense and a one-off variable expense.
- [ ] Edit a one-off expense (title/amount/category/kind/note/date as supported) and verify persistence.
- [ ] Delete a one-off expense and verify it stays deleted after hard refresh.
- [ ] Main-category totals include their subcategory expenses.
- [ ] Main donut/subcategory breakdown match the visible entries.
- [ ] Six-month evolution matches actual materialized spending.
- [ ] Switching Budget months shows the correct independent month data.

## Budget — monthly recurrence

- [ ] Create a **Mensuelle** expense and confirm its recurring indicator is visible.
- [ ] The creation produces only one series/first occurrence even if the same request is retried/double-submitted.
- [ ] Two separate identical-looking recurring submissions still create two independent series.
- [ ] Navigate forward several months: exactly one occurrence exists per applicable month.
- [ ] Hard reload/repeated month loads never create duplicate occurrences.
- [ ] No occurrence exists before the series `start_month`.
- [ ] Day 31 clamps correctly in 30-day months and February (28/29) without permanently changing the requested recurrence day.
- [ ] Recurring occurrences are included in total, category totals/donuts and six-month evolution.

### Recurring edit scope

- [ ] **Ce mois uniquement** — only the selected occurrence changes; past/future template behavior is unchanged.
- [ ] **Ce mois et les suivants** — selected month and later generated/future occurrences use the new values; earlier months remain historical.
- [ ] Editing amount/title only on a clamped February occurrence does not accidentally change a day-31 series to day 28.
- [ ] Explicitly changing the occurrence date with “Ce mois et les suivants” updates the recurrence day for later months.
- [ ] A previously unmaterialized historical month remains based on the old template after a later whole-series edit (history is frozen, not rewritten).

### Recurring delete/stop scope

- [ ] **Ce mois uniquement** — selected occurrence disappears, a skip tombstone prevents regeneration, later recurrence continues.
- [ ] **Arrêter à partir de ce mois** — selected month and later occurrences disappear; earlier history remains.
- [ ] Stopped series never regenerates at/after its exclusive `end_month`.
- [ ] Previously skipped months remain skipped after whole-series edits/stops.

## Budget — shares (“Par personne”)

- [ ] With no explicit Budget share count, divisor falls back to the active household member count.
- [ ] Set Parts to 3: monthly/category “Par personne” values use 3 everywhere.
- [ ] Share count persists across month switches, reloads and a second household member.
- [ ] Decrement is disabled at 1.
- [ ] Changing Parts does not change raw spending totals, donuts or evolution.

## Budget — monthly planned targets

- [ ] Month with no targets does not display a fake “planned = 0” total.
- [ ] Set targets for multiple main categories; overall planned Budget equals their sum.
- [ ] Actual below target shows the correct **Reste** amount.
- [ ] Actual above target shows the correct **Dépassement** amount.
- [ ] Category progress remains visually bounded while overspend state is still represented correctly.
- [ ] Clearing/zeroing a target removes the row and reduces the overall planned sum.
- [ ] Targets are independent by month and persist after reload.
- [ ] A second member sees/edits the same household targets.
- [ ] UI never offers a target for a subcategory; a direct invalid write is rejected by the database.
- [ ] Switching months quickly never displays/saves one month's targets under another month.
- [ ] During a target month load, editing controls do not allow stale target state to be submitted.

## State, concurrency and failure cases

- [ ] Rapid month back/forward navigation does not mix entries/evolution/targets between months.
- [ ] Double-clicking save/add controls does not create duplicate recurring data.
- [ ] Reload during normal usage leaves the app in a coherent persisted state.
- [ ] Simulated Supabase failure surfaces a useful error and does not leave optimistic state permanently incorrect.
- [ ] Two members can use the same household without obvious stale-state corruption; refresh reconciles to the same database truth.
- [ ] Recurrence generation vs occurrence deletion/series edit/series stop produces no duplicate or resurrected rows under repeated/concurrent actions.

## Access protection / RLS

Prefer two separate households for cross-household checks.

- [ ] Logged-out `/` redirects to `/login`.
- [ ] Direct authenticated `INSERT` into `households` is rejected; household creation RPC still works.
- [ ] Account A cannot read account B household rows through direct Supabase queries.
- [ ] Account A cannot edit/delete B's shopping/tasks/notes/links/events.
- [ ] Account A cannot read/create/edit/delete B's Budget entries/categories/targets.
- [ ] Account A cannot materialize or mutate B's recurring expense series by supplying B identifiers to RPCs.
- [ ] Budget target write using another household's category id is rejected.
- [ ] Recurring entry cannot be attached to a recurring series from another household.
- [ ] Non-admin cannot bypass invitation or household admin restrictions through direct RPC/table calls.

## Cross-cutting UI checks

- [ ] **Mobile** — below the app breakpoint, bottom navigation and forms remain usable; no horizontal overflow/overlap.
- [ ] Test Budget cards, modals, charts, long labels and recurrence scope dialogs at mobile width.
- [ ] **Hard refresh** — `/`, `/login`, `/signup`, `/onboarding` and an invite route load correctly when directly refreshed.
- [ ] Browser console has no unexpected Supabase/RLS permission errors during valid flows.
- [ ] No fake/mock placeholder content or dead-looking interactive controls remain.
- [ ] Loading/disabled states make destructive or duplicate submissions difficult.

---

# Deployment readiness checklist

Before considering V1 production-ready:

- [ ] `main` CI passes (`npm run lint` + `npm run build` from `apps/web`).
- [ ] Supabase fresh-project SQL order is documented and, for the target environment, all required migrations are applied:
  1. `schema.sql`
  2. `grants.sql`
  3. `household-rpc.sql`
  4. `household-invitations.sql`
  5. `budget.sql`
  6. `budget_recurring_expenses.sql`
  7. `budget_recurring_series_management.sql`
  8. `budget_shares.sql`
  9. `budget_monthly_targets.sql`
- [ ] `budget_recurring_series_management_fix.sql` is **not** applied on a fresh project; it is only the historical corrective migration for databases that received the older faulty management migration.
- [ ] RLS is enabled on all household-scoped core, invitation and Budget tables.
- [ ] Required household/invitation/Budget RPCs exist and are callable only in the intended security context.
- [ ] Vercel Root Directory is `apps/web`.
- [ ] Vercel has exactly the required public Supabase configuration: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (or equivalent privileged secret) is absent from frontend/public Vercel configuration and committed files.
- [ ] Supabase Auth Site URL / allowed redirect URLs match the deployed domain(s).
- [ ] Manual functional, Budget, multi-account, RLS and mobile QA above has passed or every remaining issue is explicitly tracked.
