# Kasaly — Current Supabase data model

This document describes the **persisted V1 schema currently used by Kasaly**. Supabase/Postgres is the source of truth; the application no longer relies on in-memory mock data for these features.

For exact DDL, constraints, grants and RPC implementations, use the SQL files under `supabase/`.

## Core household model

### `households`

Top-level container for shared data.

Important fields:

- `id` — UUID primary key
- `name`
- `type` — `Couple | Colocation | Famille`
- `budget_share_count` — nullable integer added by `budget_shares.sql`; when null, Budget falls back to the active household member count
- timestamps

Direct authenticated household creation is intentionally blocked. `create_household_with_member` creates the household and its first admin atomically.

### `household_members`

Links a Supabase Auth user to one household.

Important fields:

- `id`
- `household_id`
- `user_id` → `auth.users.id`
- `role` — `admin | member`
- `display_name`, `initial`, `color`
- `created_at`

`household-rpc.sql` adds a unique index on `user_id`, enforcing the V1 rule that one authenticated user belongs to at most one household.

## Shared household content

All of the following rows carry a `household_id` and are protected by RLS so members only access their own household.

### `shopping_items`

Shared shopping list.

Key fields: `label`, optional `quantity`, `done`, optional `assigned_to`, optional `created_by`, timestamps.

### `tasks`

Shared to-dos.

Key fields: `title`, `due_label`, `due_type`, optional `due_date`, optional `recurrence_rule`, `done`, optional `assigned_to`, optional `created_by`, timestamps.

### `events`

Shared agenda events.

Key fields: `title`, `event_date`, optional `event_time`, optional `location`, optional `assigned_to`, optional `created_by`, timestamps.

### `notes`

Shared categorized notes.

Key fields: `title`, `content`, `category`, optional `created_by`, timestamps.

### `useful_links`

Shared categorized bookmarks.

Key fields: `title`, `url`, `category`, `icon`, optional `created_by`, timestamps.

## Household invitations

### `household_invitations`

Stores copyable invitation links.

Important fields:

- `household_id`
- `invited_email`
- `role`
- unique `token`
- `created_by`
- `expires_at`
- optional `accepted_at`, `accepted_by`

RLS is enabled but **no direct authenticated CRUD policies are defined**. Reads/writes go through:

- `create_household_invitation`
- `get_household_invitation`
- `accept_household_invitation`

These RPCs enforce authentication, admin-only creation, expiry/one-time-use and the one-household-per-user rule.

## Budget model

Budget uses integer cents for monetary values to avoid floating-point rounding drift.

### `budget_categories`

Two-level category tree.

Important fields:

- `household_id`
- `parent_id` — null for a main category; points to another category for a subcategory
- `name`, `icon`, `sort_order`
- timestamps

`ensure_default_budget_categories(household_id)` seeds the default tree idempotently. Members can read their household categories; category writes are intentionally restricted to the seeding path in the current V1.

### `budget_entries`

Materialized expenses used by totals, category views, donuts and monthly evolution.

Important fields:

- `household_id`
- optional `category_id`
- `title`
- `amount_cents`
- `entry_date`
- `entry_month` — normalized first day of the month used for indexed monthly filtering
- `kind` — `fixed | variable`
- optional `note`
- optional `created_by`
- optional `recurring_expense_id` — null for one-off expenses, set for generated monthly occurrences
- timestamps

A generated recurring occurrence may not change its `recurring_expense_id` or move to another `entry_month`; database guards enforce these invariants.

### `budget_recurring_expenses`

Template/series for a monthly recurring expense.

Important fields:

- `household_id`
- optional `category_id`
- `title`, `amount_cents`, `kind`, optional `note`
- `recurrence_day` — requested day 1–31; generated dates clamp to the target month's last valid day
- `start_month`
- optional `end_month` — **exclusive** stop boundary; no occurrence may exist/generate at or after it
- optional `created_by`
- `creation_request_id` — per-submission idempotency token
- timestamps

A unique `(household_id, creation_request_id)` index makes creation retry-safe without collapsing two genuinely separate but identical-looking expenses.

### `budget_recurring_expense_skips`

Durable tombstones for “delete this occurrence only”.

Important fields:

- `recurring_expense_id`
- `skip_month`
- `created_at`

`UNIQUE (recurring_expense_id, skip_month)` ensures an occurrence deleted for one month cannot silently reappear during later materialization.

### Monthly recurrence behavior

`ensure_budget_recurring_occurrences(household, from_month, to_month)` materializes missing occurrences on demand rather than relying on a cron job.

Database guarantees include:

- at most one generated row per `(recurring_expense_id, entry_month)`
- no generation before `start_month`
- no generation at/after `end_month`
- skipped months stay skipped
- day-of-month clamping for short months
- advisory-lock serialization around generation/deletion/whole-series mutations

Whole-series actions are exposed through narrowly scoped RPCs:

- edit “Ce mois et les suivants”
- stop “Arrêter à partir de ce mois”

Past history is preserved; a future-series edit does not silently rewrite earlier occurrences.

### `budget_monthly_targets`

Planned monthly amount per **main** Budget category.

Important fields:

- `household_id`
- `category_id`
- `target_month`
- `amount_cents` (> 0)
- timestamps

`UNIQUE (household_id, category_id, target_month)` allows one target per main category/month. RLS also verifies the category belongs to the same household and is a main category (`parent_id IS NULL`).

There is no separate global monthly target row: the overall planned Budget is derived by summing the category targets.

## Budget shares

`households.budget_share_count` is a household-wide integer used as the divisor for “Par personne”.

- `NULL` → fall back to active household member count
- integer `>= 1` → explicit Budget share count

Because direct `households` updates are admin-only, any household member changes this one field through `set_household_budget_share_count`, a narrowly scoped `SECURITY DEFINER` RPC.

## Relationships

```text
households
├── household_members
├── household_invitations
├── shopping_items
├── tasks
├── events
├── notes
├── useful_links
├── budget_categories
│   └── budget_categories (subcategories via parent_id)
├── budget_entries
├── budget_recurring_expenses
│   ├── budget_entries (generated occurrences)
│   └── budget_recurring_expense_skips
└── budget_monthly_targets
```

Several content tables optionally reference `household_members` through `assigned_to` or `created_by`.

## RLS and RPC security model

The security boundary is server-side:

- Household-scoped tables use RLS based on `is_household_member(household_id)` and, where required, `is_household_admin(household_id)`.
- Foreign identifiers such as Budget category/recurring-series ids are revalidated against the same household rather than trusted from the client.
- Direct household creation is denied; use the atomic creation RPC.
- Invitation rows are RPC-only.
- Recurring-series updates that cannot be expressed safely as simple row CRUD use narrowly scoped RPCs with explicit membership/validation and concurrency protection.
- The browser uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in frontend/public Vercel configuration.

## SQL source-of-truth order

For a fresh project, apply:

1. `schema.sql`
2. `grants.sql`
3. `household-rpc.sql`
4. `household-invitations.sql`
5. `budget.sql`
6. `budget_recurring_expenses.sql`
7. `budget_recurring_series_management.sql`
8. `budget_shares.sql`
9. `budget_monthly_targets.sql`

`budget_recurring_series_management_fix.sql` is a legacy corrective migration only; it is not required on a fresh database because the corrected function is already present in `budget_recurring_series_management.sql`.
