-- =============================================================================
-- Kasaly — Budget module: monthly budget targets (issue #113)
--
-- Lets a household plan a target amount per MAIN Budget category for a given
-- month, so the UI can compare planned vs actual spending. The overall
-- monthly planned budget is always DERIVED (summed client-side from the
-- per-category rows read here) — there is no separate "global target" row
-- or column anywhere, so the two figures can never drift apart.
--
-- ⚠️ ADDITIVE ONLY — safe to apply while the current production version is
-- still running. No existing table is altered; a household with no targets
-- for a month simply has no rows here, which the app already treats as
-- "no plan defined yet" (see budgetData.ts).
--
-- Prerequisite: supabase/schema.sql and supabase/budget.sql must already be
-- applied — this file reuses handle_updated_at(), is_household_member() and
-- the budget_categories table defined there.
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- budget_monthly_targets
-- One row per (household, MAIN category, month) — subcategories never get
-- their own target (issue #113 is explicitly main-category-only; see the
-- budget_main_category_in_household() check below, enforced on every write).
--
-- amount_cents > 0, not >= 0: a target of exactly 0 carries no information
-- a household would actually want to plan around, and the UI treats a blank
-- or zeroed input as "clear the target" rather than "plan to spend nothing"
-- (see upsertBudgetMonthlyTarget/deleteBudgetMonthlyTarget in
-- lib/supabase/budget.ts) — so a meaningless zero row is never written in
-- the first place, matching this constraint.
--
-- UNIQUE (household_id, category_id, target_month) is what makes "set the
-- target for this category/month" an upsert: a household can have at most
-- one planned amount per category per month, ever.
-- -----------------------------------------------------------------------------
CREATE TABLE budget_monthly_targets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid        NOT NULL REFERENCES households(id)       ON DELETE CASCADE,
  category_id   uuid        NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  target_month  date        NOT NULL CHECK (target_month = date_trunc('month', target_month)::date),
  amount_cents  integer     NOT NULL CHECK (amount_cents > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, category_id, target_month)
);

-- Primary access pattern: "every target for this household's selected
-- month" (one query per Budget month load/switch, see fetchBudgetMonthlyTargets).
CREATE INDEX idx_budget_monthly_targets_household_month
  ON budget_monthly_targets (household_id, target_month);

CREATE INDEX idx_budget_monthly_targets_category_id
  ON budget_monthly_targets (category_id);

CREATE TRIGGER trg_budget_monthly_targets_updated_at
  BEFORE UPDATE ON budget_monthly_targets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE budget_monthly_targets ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- HELPER: budget_main_category_in_household
-- Guards budget_monthly_targets.category_id on every write: the category
-- must (1) exist, (2) belong to the same household as the target, and
-- (3) be a MAIN category (parent_id IS NULL) — a subcategory can never
-- receive its own target in this version. Unlike budget_category_in_
-- household() in budget.sql (which treats a NULL category_id as valid,
-- since budget_entries.category_id is nullable), category_id is NOT NULL
-- here, so there is no "NULL is fine" branch: a NULL or dangling id simply
-- fails EXISTS, which is the correct outcome either way.
--
-- Not SECURITY DEFINER, for the same reason as budget_category_in_
-- household(): the surrounding policy already requires
-- is_household_member(target_household_id), and members already have
-- SELECT on their own household's budget_categories rows, so this can
-- safely run under the caller's own RLS-restricted view.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION budget_main_category_in_household(target_category_id uuid, target_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   budget_categories
    WHERE  id           = target_category_id
      AND  household_id = target_household_id
      AND  parent_id IS NULL
  );
$$;


-- -----------------------------------------------------------------------------
-- POLICIES: budget_monthly_targets
-- Plain member-scoped CRUD, mirroring budget_entries' own policies — no RPC
-- is needed here (unlike the recurring-series mutations in issue #110): a
-- target is a simple, fully member-owned row with no cross-cutting
-- invariants (no advisory locks, no generation, no series semantics) that
-- would require bypassing RLS. INSERT/UPDATE both re-check household
-- membership AND that the target category is a main category of that same
-- household, exactly the same way budget_entries' policies double-check
-- category_id via budget_category_in_household().
-- -----------------------------------------------------------------------------
CREATE POLICY "members_can_select_budget_monthly_targets"
  ON budget_monthly_targets
  FOR SELECT TO authenticated
  USING (is_household_member(household_id));

CREATE POLICY "members_can_insert_budget_monthly_targets"
  ON budget_monthly_targets
  FOR INSERT TO authenticated
  WITH CHECK (
    is_household_member(household_id)
    AND budget_main_category_in_household(category_id, household_id)
  );

CREATE POLICY "members_can_update_budget_monthly_targets"
  ON budget_monthly_targets
  FOR UPDATE TO authenticated
  USING     (is_household_member(household_id))
  WITH CHECK (
    is_household_member(household_id)
    AND budget_main_category_in_household(category_id, household_id)
  );

CREATE POLICY "members_can_delete_budget_monthly_targets"
  ON budget_monthly_targets
  FOR DELETE TO authenticated
  USING (is_household_member(household_id));


-- =============================================================================
-- GRANTS
-- Mirrors supabase/grants.sql / budget.sql — required when Supabase's
-- automatic table exposure is disabled, since RLS policies only run after
-- the table-level privilege check passes.
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE budget_monthly_targets TO authenticated;
