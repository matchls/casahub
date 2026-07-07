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
- [ ] **Logout / login persistence** — log out, then log back in with the
      same account; shopping list, tasks, notes, links, agenda, and member
      list are all unchanged from before logout.
- [ ] **Onboarding — household creation** — a user with no household is
      redirected to `/onboarding`; creating a household succeeds and lands
      on the dashboard.
- [ ] **Dashboard** — household profile, members, and all widgets load
      without errors for a user with a household.
- [ ] **Profile — household name edit** — an admin renames the household
      from Profile (Modifier → input → Enregistrer); the new name updates
      immediately in Sidebar/Header/Profile and still shows after a hard
      refresh. A non-admin does not see the "Modifier" control.
- [ ] **Shopping list** — add an item, toggle it done/undone, hard refresh —
      state persists.
- [ ] **Tasks** — add a task, toggle done/undone, hard refresh — state
      persists.
- [ ] **Notes** — add a note under each category, hard refresh — notes
      persist and stay grouped by category.
- [ ] **Useful links** — add a link, hard refresh — link persists.
- [ ] **Agenda** — add an event, hard refresh — event persists and appears
      in the correct date order.
- [ ] **Member invitations** — an admin creates an invitation from
      Profile / Membres and gets a copyable link (V1 uses copyable links
      only — there is no automatic email sending). A second account opens
      the link, logs in or signs up, accepts the invitation, and lands in
      the same household with the same shared data. See
      [Invitation flow](#invitation-flow) below for the full checklist.

## Delete flows (issue #78)

Each item type below is deletable via a small, discreet control (e.g. `×`)
without disrupting existing interactions on the same row/card.

- [ ] **Delete shopping item** — add an item, delete it, hard refresh — it
      does not reappear.
- [ ] **Delete task** — add a task, delete it, hard refresh — it does not
      reappear.
- [ ] **Delete note** — add a note, delete it (confirm dialog if shown),
      hard refresh — it does not reappear.
- [ ] **Delete useful link / shared code** — add a link, delete it (confirm
      dialog if shown), hard refresh — it does not reappear.
- [ ] **Delete agenda event** — add an event, delete it (confirm dialog if
      shown), hard refresh — it does not reappear.
- [ ] **No accidental side effects** — deleting a shopping item or task does
      not toggle its done state; deleting a useful link does not open or
      navigate to its URL.
- [ ] **Delete failure handling** — if the Supabase delete call fails, the
      item reappears in the UI (rollback) and a clear error is shown/logged,
      instead of silently disappearing for good.
- [ ] **Cross-household protection** — a member of one household cannot
      delete another household's item (RLS blocks it — verify with a direct
      API/SQL attempt as in [Access protection](#access-protection) below).

## Invitation flow

- [ ] **Create invitation (admin)** — from Profile / Membres, an admin
      enters an email and creates an invitation; a copyable invite link is
      shown.
- [ ] **Create invitation (non-admin)** — a non-admin member does not see
      the invite control; calling `create_household_invitation` directly
      for a non-admin fails.
- [ ] **Accept — logged out** — opening `/invite/<token>` while logged out
      shows a "log in or sign up" screen instead of the app's normal
      logged-out redirect.
- [ ] **Accept — login round trip** — logging in from that screen returns
      to `/invite/<token>` afterward (not the dashboard).
- [ ] **Accept — signup round trip** — signing up from that screen (with
      email confirmation off, or after confirming) returns to
      `/invite/<token>` and skips `/onboarding`.
- [ ] **Accept — success** — a logged-in invited user sees the household
      name and a "Rejoindre le foyer" button; accepting adds them as a
      `household_members` row with role `member` and redirects to `/`.
- [ ] **Accept — already in a household** — a logged-in user who already
      belongs to a household gets a clear error when accepting, and is not
      added to a second household.
- [ ] **Accept — expired invite** — an invitation past `expires_at` shows a
      clear "expired" message, not a generic error.
- [ ] **Accept — already accepted** — reusing a token that was already
      accepted shows a clear "already used" message.
- [ ] **Shared data after joining** — the new member sees the same
      shopping list / tasks / notes / links / agenda as the existing admin,
      and the admin sees the new member appear in the member list.

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
- [ ] **No fake placeholders visible** — no hardcoded/mock content remains
      anywhere in the app: no fake member names or avatars, no mock
      timeline items in "La journée", no buttons styled as clickable that
      don't do anything. This guards against regressions of the cleanup in
      PR #67 and PR #69.

---

# Deployment readiness checklist

Run through this before considering a V1 deploy production-ready.

- [ ] CI passes on `main` (`.github/workflows/ci.yml` — lint + build).
- [ ] Supabase schema applied (`supabase/schema.sql`).
- [ ] Supabase grants applied (`supabase/grants.sql`).
- [ ] Supabase RPC applied (`supabase/household-rpc.sql`) — also drops the
      legacy direct-INSERT policy on `households` on already-provisioned
      projects.
- [ ] Supabase invitations SQL applied (`supabase/household-invitations.sql`)
      — `household_invitations` table + invitation RPCs.
- [ ] Row Level Security (RLS) enabled on all tables (verified in
      `supabase/schema.sql` — `households`, `household_members`,
      `shopping_items`, `tasks`, `events`, and other app tables).
- [ ] Vercel environment variables configured (see
      [docs/deployment.md](deployment.md)): `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Supabase Auth redirect URLs configured for the deployed domain(s), if
      not already set.
- [ ] Manual QA checklist above passed.
