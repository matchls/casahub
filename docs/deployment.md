# Deployment (Vercel)

## Project structure

This repo is **not** an npm-workspaces monorepo — `apps/web` is a self-contained
Next.js app with its own `package.json` and `package-lock.json`. The root
`package.json` only proxies scripts (`npm --prefix apps/web run <script>`).

`.github/workflows/ci.yml` already builds the project this way: it runs
`npm ci` / `npm run lint` / `npm run build` with `working-directory: apps/web`
on Node 24. Vercel should mirror that.

## Vercel project setup

1. Import `matchls/casahub` into Vercel.
2. **Framework Preset:** Next.js (auto-detected).
3. **Root Directory:** `apps/web`
   This is the key monorepo setting. It tells Vercel to install and build
   inside `apps/web`, using that directory's own lockfile — matching CI
   exactly. Do not point Root Directory at the repo root.
4. With Root Directory set to `apps/web`, leave the install/build/output
   settings on the Next.js preset defaults:
   - **Install Command:** `npm ci` (default, since a lockfile is present)
   - **Build Command:** `npm run build` (`next build`)
   - **Output:** managed automatically by the Next.js Vercel builder — no
     manual output directory needed.
5. **Node.js version:** 24, to match `.github/workflows/ci.yml`. Set this in
   Project Settings → General if the Vercel default differs.

No `vercel.json` exists or is required for this setup.

## Required environment variables

Configure these in Vercel → Project Settings → Environment Variables, for
Production, Preview, and Development:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. Public — safe to expose to the browser. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable (anon) key. Public — safe to expose to the browser. |

These are the only two environment variables read by the app today
(`apps/web/src/lib/supabase/client.ts`, `server.ts`, and `proxy.ts`).

**Do not** add the Supabase `service_role` / secret key to Vercel or to any
file in this repository. No server-side code in this project currently
requires it — all data access goes through the publishable key plus Row
Level Security policies (see `supabase/schema.sql`).

For local development, copy `apps/web/.env.local.example` to
`apps/web/.env.local` and fill in real values (never commit `.env.local`).

## Supabase SQL setup

Apply these files **in order**, via the Supabase SQL Editor, on a fresh
project (see [README.md](../README.md#supabase-setup) for the per-file
description):

1. `supabase/schema.sql`
2. `supabase/grants.sql`
3. `supabase/household-rpc.sql`
4. `supabase/household-invitations.sql`

Re-running this same order is also how an already-provisioned project picks
up later hardening (e.g. `household-rpc.sql` dropping the legacy direct-INSERT
policy on `households`).

### Post-SQL checklist

- [ ] **RLS enabled** — Row Level Security is on for every table
      (`households`, `household_members`, `shopping_items`, `tasks`,
      `events`, `notes`, `useful_links`, `household_invitations`).
- [ ] **RPCs available** — `create_household_with_member` exists and is
      callable (onboarding depends on it).
- [ ] **Direct household insert policy removed** — there is no RLS policy
      allowing a direct `INSERT` into `households`; only the RPC above can
      create one.
- [ ] **Invitation RPCs available** — `create_household_invitation`,
      `get_household_invitation`, and `accept_household_invitation` all
      exist and are callable.
- [ ] **No `service_role` frontend usage** — the app only ever uses the
      publishable/anon key; `service_role` is not present in `.env.local`,
      Vercel env vars, or any committed file.

## Supabase Auth redirect URLs

Supabase Auth email confirmation is enabled for this project (see
[docs/qa-v1.md](qa-v1.md)), so Supabase needs to know which URLs are allowed
to complete a confirmation link. Configure these under Supabase →
Authentication → URL Configuration once a Vercel deployment URL exists.
Don't guess the final domain — use placeholders until it's assigned:

- **Site URL:** `https://your-vercel-domain.vercel.app` (swap for
  `https://your-custom-domain.com` once a custom domain is attached). This
  is the base URL Supabase uses to build confirmation-email links.
- **Redirect URLs:** add the same domain(s) (e.g.
  `https://your-vercel-domain.vercel.app/**`). Only add preview-deployment
  URLs here if confirmation emails need to work against per-PR preview
  links — each preview gets its own `*.vercel.app` URL, and this isn't
  required for the production QA pass.

These two settings only control where the **confirmation-email link** (and
any future OAuth callback) land. They're unrelated to the app's own `next=`
query param described below, which is pure client-side routing and needs no
Supabase configuration.

### Login / signup flow and the `next=` param

`apps/web/src/proxy.ts` redirects any signed-out visitor hitting a
non-public route to `/login?next=<original-path>`. `LoginForm` and
`SignupForm` (`apps/web/src/features/auth/`) both read that value (sanitized
by `sanitizeNextPath` in `apps/web/src/lib/utils.ts`):

- On successful login: `router.push(next || "/")`.
- On successful signup **with an immediate session** (email confirmation
  disabled): `router.push(next || "/onboarding")`.
- On signup **without an immediate session** (email confirmation enabled —
  the current project setting), no redirect happens yet: the user sees a
  "check your email" message and must confirm, then log in separately. The
  `next` value is not preserved through the confirmation email itself.
- The `/login` ↔ `/signup` links on each form forward `next` to each other,
  so switching forms mid-flow doesn't lose the return path.

### Invite flow (`/invite/[token]`)

`/invite/[token]` is allowlisted in `proxy.ts` (`isGuestAllowed`), so
signed-out visitors land on the invite page itself instead of being bounced
to `/login`. That page then:

- Shows its own "Se connecter" / "Créer un compte" links, each pointing to
  `/login?next=/invite/<token>` / `/signup?next=/invite/<token>`.
- Relies on the login/signup flow above to return the user to
  `/invite/<token>` after authenticating.
- Because email confirmation is enabled, a **brand-new signup** from this
  screen does not auto-return to the invite page (no session exists yet) —
  the tester must confirm the email, then open the invite link again (or log
  in with `next` pointing at it) to accept. This is expected behavior, not a
  bug — see the invitation flow checklist in [docs/qa-v1.md](qa-v1.md).

No extra Supabase Auth URL configuration is needed for `/invite/[token]`
specifically — it's handled entirely by the app's own routing once Site URL
/ Redirect URLs above are set for the deployment domain.

## Out of scope here

- No manual deploy is triggered by this change — deployment happens via
  Vercel's Git integration (push/PR) or is performed by a project owner.
- No secrets are added anywhere in this repo as part of this change.
