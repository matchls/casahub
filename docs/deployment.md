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

## Supabase auth redirect URLs

Supabase Auth email confirmation is enabled for this project (see
[docs/qa-v1.md](qa-v1.md)). Once a Vercel deployment URL exists, add it in
Supabase → Authentication → URL Configuration:

- **Site URL:** the production deployment URL (e.g. `https://<project>.vercel.app`)
- **Redirect URLs:** add preview-deployment URLs too if preview links need to
  complete the email-confirmation flow

## Out of scope here

- No manual deploy is triggered by this change — deployment happens via
  Vercel's Git integration (push/PR) or is performed by a project owner.
- No secrets are added anywhere in this repo as part of this change.
