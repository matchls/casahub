# V1 QA checklist

Manual QA to run against a deployed (or local) build before/after each V1
release. Use a real Supabase-backed environment — these flows exercise
live database reads/writes, not mocked data.

> **Known limitation:** Supabase email confirmation is enabled on this
> project, so a brand-new signup has no session until the confirmation link
> is clicked. Use a pre-confirmed test account for login-gated steps below,
> or complete the confirmation link manually from the test inbox.

## Functional walkthrough

- [ ] **Signup** — create a new account with email + password; confirmation
      message is shown (no crash, no unhandled error).
- [ ] **Login** — log in with a confirmed test account; redirected to the
      dashboard.
- [ ] **Onboarding — household creation** — a user with no household is
      redirected to `/onboarding`; creating a household succeeds and lands
      on the dashboard.
- [ ] **Dashboard** — household profile, members, and all widgets load
      without errors for a user with a household.
- [ ] **Shopping list** — add an item, toggle it done/undone, hard refresh —
      state persists.
- [ ] **Tasks** — add a task, toggle done/undone, hard refresh — state
      persists.
- [ ] **Notes** — add a note under each category, hard refresh — notes
      persist and stay grouped by category.
- [ ] **Useful links** — add a link, hard refresh — link persists.
- [ ] **Agenda** — add an event, hard refresh — event persists and appears
      in the correct date order.

## Access protection

- [ ] **Logged-out access** — visiting `/` while logged out redirects to
      `/login`.
- [ ] **No household** — a logged-in user with no household is redirected
      to `/onboarding` when visiting `/`.
- [ ] **Already has a household** — a logged-in user with a household who
      navigates to `/onboarding` is redirected away, *if that redirect is
      implemented*. (Not implemented as of this checklist — confirm current
      behavior and file a follow-up issue if it should be added.)
- [ ] **Direct household insert is blocked** — as an authenticated client
      (e.g. Supabase SQL Editor running `set role authenticated;` or the API
      with a user's access token), attempt
      `insert into households (name, type) values ('x', 'Couple');` — it must
      fail with a permission/RLS error, not succeed.
- [ ] **RPC household creation still works** — `create_household_with_member`
      still creates a household plus exactly one admin `household_members`
      row for a user with no existing household (covered by the onboarding
      flow above, or callable directly via `supabase.rpc(...)`).

## Cross-cutting checks

- [ ] **Responsive/mobile sanity check** — dashboard and forms are usable
      at mobile width (below the 880px breakpoint): bottom nav present,
      bento grid collapses to 2 columns, no horizontal scroll/overlap.
- [ ] **Hard refresh smoke test** — hard-refresh (not client navigation) on
      `/`, `/login`, `/signup`, and `/onboarding` each load correctly.
- [ ] **No console Supabase permission errors** — browser console is free of
      Supabase/RLS permission errors (e.g. `permission denied for table …`)
      across all pages above.

---

# Deployment readiness checklist

Run through this before considering a V1 deploy production-ready.

- [ ] CI passes on `main` (`.github/workflows/ci.yml` — lint + build).
- [ ] Supabase schema applied (`supabase/schema.sql`).
- [ ] Supabase grants applied (`supabase/grants.sql`).
- [ ] Supabase RPC applied (`supabase/household-rpc.sql`) — also drops the
      legacy direct-INSERT policy on `households` on already-provisioned
      projects.
- [ ] Row Level Security (RLS) enabled on all tables (verified in
      `supabase/schema.sql` — `households`, `household_members`,
      `shopping_items`, `tasks`, `events`, and other app tables).
- [ ] Vercel environment variables configured (see
      [docs/deployment.md](deployment.md)): `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Supabase Auth redirect URLs configured for the deployed domain(s), if
      not already set.
- [ ] Manual QA checklist above passed.
