# CasaHub — Target Data Model

This document describes the target Supabase schema for V1. All data is currently served from in-memory mocks; this is the migration target.

## Entities

### `households`

The top-level container. Every other entity belongs to a household.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `text` | e.g. "Chez Léa & Tom" |
| `type` | `text` | `'Couple' \| 'Colocation' \| 'Famille'` |
| `created_at` | `timestamptz` | Default `now()` |

---

### `household_members`

Members belonging to a household. One member is designated admin at creation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Also maps to Supabase auth user id |
| `household_id` | `uuid` FK → `households.id` | |
| `name` | `text` | Display name |
| `role` | `text` | `'admin' \| 'member'` |
| `initial` | `text` | Single letter for avatar |
| `color` | `text` | Hex color for avatar background |
| `created_at` | `timestamptz` | Default `now()` |

---

### `shopping_items`

Items on the shared shopping list. Supports per-item quantity and member assignment.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK → `households.id` | |
| `label` | `text` | Item name |
| `quantity` | `int` | Optional, null if unspecified |
| `done` | `boolean` | Default `false` |
| `assigned_to` | `uuid` FK → `household_members.id` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

---

### `tasks`

Household tasks with optional due date or recurrence.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK → `households.id` | |
| `title` | `text` | |
| `due_label` | `text` | Human-readable label e.g. "Ce soir", "Tous les 3 jours" |
| `due_type` | `text` | `'date' \| 'recurrence' \| 'none'` |
| `done` | `boolean` | Default `false` |
| `assigned_to` | `uuid` FK → `household_members.id` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

---

### `events`

Calendar events shared across the household.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK → `households.id` | |
| `type` | `text` | `'event' \| 'task' \| 'shopping' \| 'reminder'` |
| `title` | `text` | |
| `starts_at` | `timestamptz` | Full datetime |
| `location` | `text` | Optional |
| `assigned_to` | `uuid` FK → `household_members.id` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

> **Note:** The V1 frontend displays events in pre-bucketed groups (today / tomorrow / this_week / next_week). In V2 these groups will be derived at query time from `starts_at` relative to `now()`.

---

### `notes`

Shared household notes, organized by category.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK → `households.id` | |
| `title` | `text` | Short label or key |
| `content` | `text` | Default `''` |
| `category` | `text` | `'wifi' \| 'codes' \| 'numbers' \| 'ideas'` |
| `created_by` | `uuid` FK → `household_members.id` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

---

### `useful_links`

Shared bookmarks organized by category.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK → `households.id` | |
| `title` | `text` | Display label |
| `url` | `text` | Full URL including scheme |
| `category` | `text` | `'home' \| 'health' \| 'documents' \| 'admin' \| 'services' \| 'ideas'` |
| `icon` | `text` | Emoji icon |
| `created_by` | `uuid` FK → `household_members.id` | Optional |
| `created_at` | `timestamptz` | Default `now()` |

---

## Relationships

```
households
  └── household_members (1-to-many)
  └── shopping_items    (1-to-many, assigned_to → household_members)
  └── tasks             (1-to-many, assigned_to → household_members)
  └── events            (1-to-many, assigned_to → household_members)
  └── notes             (1-to-many, created_by → household_members)
  └── useful_links      (1-to-many, created_by → household_members)
```

## Row-Level Security (future)

All tables should have RLS policies that restrict reads and writes to members of the same household. Pattern:

```sql
CREATE POLICY "household members only"
  ON shopping_items
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE id = auth.uid()
  ));
```
