-- =============================================================================
-- Kasaly — Budget module: fix edit_recurring_budget_expense_series (issue #110
-- code review follow-up)
--
-- CORRECTIVE migration for a database that has ALREADY had
-- supabase/budget_recurring_series_management.sql applied. Do NOT run the
-- original file again — this file only replaces the one function that had
-- two bugs, via CREATE OR REPLACE FUNCTION. It does not touch the
-- end_month column, its constraints, ensure_budget_recurring_occurrences,
-- or stop_recurring_budget_expense_series — none of those are affected by
-- either bug below, and nothing here drops or rewrites any data.
--
-- Bugs fixed in edit_recurring_budget_expense_series ("Ce mois et les
-- suivants"):
--
-- 1. A month before the selected occurrence that was never materialized
--    stayed unmaterialized after a whole-series edit. Because the function
--    changed the template globally, a LATER ensure_budget_recurring_
--    occurrences() call could then generate that past month using the NEW
--    template — silently rewriting history that predates the edit. Fixed
--    by materializing every still-missing month from the series' own
--    start_month up to (but excluding) the selected month, using the OLD
--    template values, BEFORE the template is changed — so every past month
--    is frozen with its correct historical values first.
--
-- 2. The function derived the new recurrence_day directly from
--    extract(day FROM target_entry_date), even when the submitted date was
--    merely an already-clamped occurrence date the member never touched
--    (e.g. a day-31 series showing Feb 28). That silently changed the
--    series' recurrence day (31 -> 28) on any edit that didn't touch the
--    date field at all. Fixed by only deriving a new recurrence_day when
--    target_entry_date actually differs from the anchor occurrence's own
--    entry_date before the edit; otherwise the existing recurrence_day is
--    preserved unchanged.
--
-- ⚠️ ADDITIVE / CORRECTIVE ONLY — safe to apply while the current
-- production application is running. CREATE OR REPLACE FUNCTION swaps the
-- function body in place, in a single DDL statement; it does not lock or
-- rewrite budget_recurring_expenses or budget_entries, and every existing
-- series, occurrence, skip tombstone and end_month value is left exactly
-- as-is. REVOKE/GRANT below are idempotent re-statements of the same
-- privileges the function already has.
--
-- Prerequisite: supabase/budget_recurring_series_management.sql must
-- already be applied (this is specifically a fix for that state).
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


CREATE OR REPLACE FUNCTION edit_recurring_budget_expense_series(
  target_entry_id     uuid,
  target_category_id  uuid,
  target_title         text,
  target_amount_cents  integer,
  target_kind          text,
  target_note          text,
  target_entry_date    date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id        uuid;
  v_recurring_id         uuid;
  v_entry_month          date;
  v_original_entry_date  date;
  v_member_id            uuid;
  v_old_category_id      uuid;
  v_old_title             text;
  v_old_amount_cents      integer;
  v_old_kind               text;
  v_old_note               text;
  v_old_recurrence_day     integer;
  v_old_start_month        date;
  v_old_end_month          date;
  v_new_recurrence_day     integer;
BEGIN
  SELECT household_id, recurring_expense_id, entry_month, entry_date
    INTO v_household_id, v_recurring_id, v_entry_month, v_original_entry_date
    FROM budget_entries
    WHERE id = target_entry_id;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;

  IF NOT is_household_member(v_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF v_recurring_id IS NULL THEN
    RAISE EXCEPTION 'Entry is not a recurring occurrence';
  END IF;

  IF target_title IS NULL OR btrim(target_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  IF target_amount_cents IS NULL OR target_amount_cents < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF target_kind IS NULL OR target_kind NOT IN ('fixed', 'variable') THEN
    RAISE EXCEPTION 'Invalid kind';
  END IF;

  IF NOT budget_category_in_household(target_category_id, v_household_id) THEN
    RAISE EXCEPTION 'Category does not belong to this household';
  END IF;

  IF target_entry_date IS NULL OR date_trunc('month', target_entry_date)::date <> v_entry_month THEN
    RAISE EXCEPTION 'Date must remain within the selected occurrence''s month';
  END IF;

  SELECT id INTO v_member_id
  FROM   household_members
  WHERE  household_id = v_household_id
    AND  user_id      = auth.uid()
  LIMIT 1;

  PERFORM pg_advisory_xact_lock(budget_recurring_expense_lock_key(v_recurring_id));

  SELECT category_id, title, amount_cents, kind, note, recurrence_day, start_month, end_month
    INTO v_old_category_id, v_old_title, v_old_amount_cents, v_old_kind, v_old_note,
         v_old_recurrence_day, v_old_start_month, v_old_end_month
    FROM budget_recurring_expenses
    WHERE id = v_recurring_id;

  INSERT INTO budget_entries (
    household_id, category_id, title, amount_cents, entry_date, entry_month,
    kind, note, created_by, recurring_expense_id
  )
  SELECT
    v_household_id,
    v_old_category_id,
    v_old_title,
    v_old_amount_cents,
    budget_recurring_occurrence_date(m.month::date, v_old_recurrence_day),
    m.month::date,
    v_old_kind,
    v_old_note,
    v_member_id,
    v_recurring_id
  FROM generate_series(v_old_start_month, (v_entry_month - interval '1 month')::date, interval '1 month') AS m(month)
  WHERE (v_old_end_month IS NULL OR m.month::date < v_old_end_month)
    AND NOT EXISTS (
      SELECT 1 FROM budget_recurring_expense_skips s
      WHERE s.recurring_expense_id = v_recurring_id AND s.skip_month = m.month::date
    )
  ON CONFLICT (recurring_expense_id, entry_month) WHERE recurring_expense_id IS NOT NULL
  DO NOTHING;

  IF target_entry_date = v_original_entry_date THEN
    v_new_recurrence_day := v_old_recurrence_day;
  ELSE
    v_new_recurrence_day := extract(day FROM target_entry_date)::integer;
  END IF;

  UPDATE budget_recurring_expenses
  SET category_id    = target_category_id,
      title          = target_title,
      amount_cents   = target_amount_cents,
      kind           = target_kind,
      note           = target_note,
      recurrence_day = v_new_recurrence_day
  WHERE id = v_recurring_id;

  UPDATE budget_entries
  SET category_id  = target_category_id,
      title        = target_title,
      amount_cents = target_amount_cents,
      kind         = target_kind,
      note         = target_note,
      entry_date   = budget_recurring_occurrence_date(entry_month, v_new_recurrence_day)
  WHERE recurring_expense_id = v_recurring_id
    AND entry_month >= v_entry_month
    AND (v_old_end_month IS NULL OR entry_month < v_old_end_month);
END;
$$;

REVOKE ALL ON FUNCTION edit_recurring_budget_expense_series(uuid, uuid, text, integer, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_recurring_budget_expense_series(uuid, uuid, text, integer, text, text, date) TO authenticated;
