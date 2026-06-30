# Service Layer

This directory contains typed service interfaces for each CasaHub data domain.

## Current state

All data is currently served from in-memory mock data via `useCasaHubState` (see `src/lib/state/useCasaHubState.ts`). No real API or database calls are made.

## Future: Supabase migration

When Supabase is connected, each service interface defined here will be implemented against the Supabase client. The migration path is:

1. Install `@supabase/supabase-js` and set up env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. Create a `supabaseClient.ts` file in this directory.
3. Implement each interface (e.g. `ShoppingService`) as a concrete class / set of functions that call `supabase.from('shopping_items')...`.
4. Replace the `useState(initialXxx)` calls in `useCasaHubState` with async fetches using the implemented services.

## Services

| File | Interface | Target Supabase table |
|------|-----------|----------------------|
| `shoppingService.ts` | `ShoppingService` | `shopping_items` |
| `tasksService.ts` | `TasksService` | `tasks` |
| `notesService.ts` | `NotesService` | `notes` |
| `linksService.ts` | `LinksService` | `useful_links` |

See `docs/data-model.md` for the full target schema.
