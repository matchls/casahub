-- =============================================================================
-- Kasaly — Budget shares (issue #109)
--
-- Lets a household configure an integer number of Budget "parts" used as the
-- divisor for every "Par personne" calculation, instead of always dividing
-- by the active household member count.
--
-- Additive only: existing households get NULL, which keeps the current
-- fallback behavior (divide by active member count) until a member
-- explicitly sets a value. No destructive backfill, no data loss.
--
-- Prerequisite: supabase/schema.sql must already be applied — this file
-- reuses is_household_member() defined there.
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- households.budget_share_count
-- NULL = "no explicit value ever saved" -> app falls back to active member
-- count. Once set, an integer >= 1 that is authoritative regardless of how
-- many members the household has.
-- -----------------------------------------------------------------------------
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS budget_share_count integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'households_budget_share_count_check'
  ) THEN
    ALTER TABLE households
      ADD CONSTRAINT households_budget_share_count_check
      CHECK (budget_share_count IS NULL OR budget_share_count >= 1);
  END IF;
END;
$$;


-- -----------------------------------------------------------------------------
-- RPC: set_household_budget_share_count
--
-- The households UPDATE RLS policy (admin_can_update_household, see
-- schema.sql) restricts direct table updates to admins. The Budget share
-- count, however, is meant to be editable by any household member — so
-- instead of widening that policy (which would let every member rename the
-- household or change its type too), this SECURITY DEFINER RPC checks plain
-- membership and writes only the budget_share_count column.
--
-- SET search_path = public prevents search_path injection, matching every
-- other SECURITY DEFINER function in this project.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_household_budget_share_count(
  target_household_id uuid,
  target_share_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_household_member(target_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF target_share_count IS NULL OR target_share_count < 1 THEN
    RAISE EXCEPTION 'Budget share count must be an integer >= 1';
  END IF;

  UPDATE households
  SET budget_share_count = target_share_count
  WHERE id = target_household_id;
END;
$$;

REVOKE ALL ON FUNCTION set_household_budget_share_count(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_household_budget_share_count(uuid, integer) TO authenticated;
