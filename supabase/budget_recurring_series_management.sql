-- =============================================================================
-- Kasaly — Budget module: recurring expense series management (issue #110)
--
-- Adds an explicit, exclusive stop boundary (end_month) to
-- budget_recurring_expenses, teaches ensure_budget_recurring_occurrences to
-- respect it, and adds two narrowly-scoped RPCs for whole-series mutation:
--   - edit_recurring_budget_expense_series ("Ce mois et les suivants")
--   - stop_recurring_budget_expense_series ("Arrêter à partir de ce mois")
--
-- The existing occurrence-only behaviour from issue #105 (delete_recurring_
-- budget_occurrence, per-month skip tombstones, "Ce mois uniquement") is
-- untouched — this file only adds new capability alongside it.
--
-- ⚠️ ADDITIVE ONLY — safe to apply while the current production version is
-- still running. end_month defaults to NULL for every existing series, which
-- is exactly "unlimited recurrence", so no existing series changes behaviour
-- until a member explicitly stops it.
--
-- Prerequisite: supabase/budget_recurring_expenses.sql must already be
-- applied — this file reuses budget_recurring_occurrence_date(),
-- budget_recurring_expense_lock_key(), budget_category_in_household() and
-- is_household_member() defined there / in budget.sql / schema.sql, and
-- replaces ensure_budget_recurring_occurrences() with a version that also
-- honours end_month.
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- COLUMN: budget_recurring_expenses.end_month
-- Nullable, EXCLUSIVE stop boundary: "the first month that must not
-- generate/exist". NULL (the default, and the value on every pre-existing
-- row) means unlimited recurrence, exactly today's behaviour. Once set (only
-- ever by stop_recurring_budget_expense_series below — there is no "resume"
-- feature in this version, so end_month only ever moves from NULL to a value
-- or stays put, never back to NULL and never earlier once set by a member
-- action), no month >= end_month may ever be generated or remain
-- materialized.
--
-- end_month = date_trunc('month', end_month) mirrors the existing
-- start_month check: every month boundary in this table is always a
-- first-of-month value, never a specific day.
-- -----------------------------------------------------------------------------
ALTER TABLE budget_recurring_expenses
  ADD COLUMN end_month date NULL;

ALTER TABLE budget_recurring_expenses
  ADD CONSTRAINT budget_recurring_expenses_end_month_check
  CHECK (end_month IS NULL OR end_month = date_trunc('month', end_month)::date);

-- Defensive integrity constraint: a series can never be stopped before it
-- starts. Both RPCs below only ever derive end_month from an already-
-- materialized occurrence's entry_month, which by construction is always
-- >= start_month, so this should never actually fire — it exists purely to
-- fail loudly instead of silently if that invariant is ever violated.
ALTER TABLE budget_recurring_expenses
  ADD CONSTRAINT budget_recurring_expenses_end_after_start_check
  CHECK (end_month IS NULL OR end_month >= start_month);


-- =============================================================================
-- RPC: ensure_budget_recurring_occurrences (REPLACED)
-- Identical to the issue #105 version (same locking strategy, same
-- three-step snapshot/lock/generate structure — see the original comment in
-- supabase/budget_recurring_expenses.sql for the full rationale, still
-- accurate here) with one addition: the generation query's WHERE clause now
-- also excludes any month >= the series' end_month, alongside the existing
-- skip-tombstone exclusion.
--
-- This is enough, on its own, to satisfy "ensure must see the committed
-- end_month before generating" (issue #110): the generation INSERT...SELECT
-- is a single statement issued strictly after every candidate series in
-- v_series_ids has been advisory-locked (step 2). Under READ COMMITTED,
-- that statement takes its own fresh snapshot — so if a concurrent
-- stop_recurring_budget_expense_series (or edit_recurring_budget_expense_
-- series) was holding the same series' lock, it has necessarily already
-- committed by the time this statement runs (pg_advisory_xact_lock only
-- returns once the holder's transaction ends), and this statement reads the
-- post-commit end_month/template values. No new locking behaviour is
-- introduced — the existing lock-then-generate ordering already provided
-- this guarantee for start_month/title/amount/etc.; end_month rides along
-- for free.
-- =============================================================================
CREATE OR REPLACE FUNCTION ensure_budget_recurring_occurrences(
  target_household_id uuid,
  from_month           date,
  to_month             date
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_member_id  uuid;
  v_series_ids uuid[];
  v_series_id  uuid;
BEGIN
  IF NOT is_household_member(target_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  from_month := date_trunc('month', from_month)::date;
  to_month   := date_trunc('month', to_month)::date;

  IF from_month > to_month THEN
    RETURN;
  END IF;

  SELECT id INTO v_member_id
  FROM   household_members
  WHERE  household_id = target_household_id
    AND  user_id      = auth.uid()
  LIMIT 1;

  SELECT array_agg(id ORDER BY id)
  INTO   v_series_ids
  FROM   budget_recurring_expenses
  WHERE  household_id = target_household_id
    AND  start_month  <= to_month;

  FOREACH v_series_id IN ARRAY COALESCE(v_series_ids, ARRAY[]::uuid[]) LOOP
    PERFORM pg_advisory_xact_lock(budget_recurring_expense_lock_key(v_series_id));
  END LOOP;

  INSERT INTO budget_entries (
    household_id, category_id, title, amount_cents, entry_date, entry_month,
    kind, note, created_by, recurring_expense_id
  )
  SELECT
    r.household_id,
    r.category_id,
    r.title,
    r.amount_cents,
    budget_recurring_occurrence_date(m.month::date, r.recurrence_day),
    m.month::date,
    r.kind,
    r.note,
    v_member_id,
    r.id
  FROM budget_recurring_expenses r
  CROSS JOIN LATERAL generate_series(
    GREATEST(from_month, r.start_month),
    to_month,
    interval '1 month'
  ) AS m(month)
  WHERE r.id = ANY(v_series_ids)
    AND (r.end_month IS NULL OR m.month::date < r.end_month)
    AND NOT EXISTS (
      SELECT 1 FROM budget_recurring_expense_skips s
      WHERE s.recurring_expense_id = r.id AND s.skip_month = m.month::date
    )
  ON CONFLICT (recurring_expense_id, entry_month) WHERE recurring_expense_id IS NOT NULL
  DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION ensure_budget_recurring_occurrences(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_budget_recurring_occurrences(uuid, date, date) TO authenticated;


-- =============================================================================
-- RPC: edit_recurring_budget_expense_series
-- "Ce mois et les suivants" — updates the recurring template AND every
-- already-materialized occurrence from the selected month onward (bounded
-- above by end_month, if the series is already stopped). Anchored on
-- target_entry_id (the recurring occurrence the member was editing), which
-- alone determines household, series and effective month — matching
-- delete_recurring_budget_occurrence's anchoring style.
--
-- SECURITY DEFINER: budget_recurring_expenses intentionally has no UPDATE
-- policy for members (see budget_recurring_expenses.sql — "Modifier toute
-- la série" was explicitly out of scope for issue #105, and issue #110
-- keeps that posture: series mutation stays possible only through this
-- tightly-scoped RPC, never via a generic UPDATE grant). Every write this
-- function performs is therefore preceded by an explicit, in-function check
-- — household membership, category household ownership, kind/amount/date
-- validity — so SECURITY DEFINER adds no privilege beyond what a household
-- member already has for their own household's data. budget_category_in_
-- household() is safe to call from here: it filters by the caller-supplied
-- target_household_id directly rather than relying on the elevated role's
-- own RLS visibility, so it returns the same answer regardless of which
-- role actually executes it.
--
-- Acquires the same transaction-scoped advisory lock as ensure_budget_
-- recurring_occurrences and delete_recurring_budget_occurrence, before
-- reading (let alone writing) anything template-shaped — see that
-- function's comment for why this serialization is necessary and how it
-- resolves concurrently.
--
-- BEFORE touching the template, this freezes history: every month from the
-- series' start_month up to (but excluding) the selected month that was
-- never materialized gets generated now, using the OLD (pre-edit) template
-- values — mirroring ensure_budget_recurring_occurrences' own generation
-- query (same skip-tombstone exclusion, same day-clamping helper, same
-- ON CONFLICT DO NOTHING idempotency). Without this, a past month that
-- happened to still be unmaterialized at edit time would later be
-- generated by ensure() using the NEW template instead — silently
-- rewriting history that predates this edit. Only AFTER that backfill does
-- the function update the template and the already-materialized
-- occurrences from the selected month onward.
--
-- Only touches occurrences already materialized in [selected month, end
-- boundary) — skipped months have no row and are therefore left alone by
-- construction (a bare UPDATE ... WHERE can't "recreate" a row that isn't
-- there), and months before the selected one are excluded by the
-- entry_month >= v_entry_month bound (they were just frozen by the
-- backfill above instead). recurring_expense_id and entry_month are never
-- written by this function, so guard_recurring_budget_entry_update's
-- invariants continue to hold untouched.
--
-- The submitted date is also NOT blindly taken as the new recurrence_day:
-- a day-31 series clamped to Feb 28 must stay a day-31 series if the member
-- only changed the amount/title and left the date input showing Feb 28 —
-- otherwise every subsequent month would incorrectly start recurring on
-- the 28th. recurrence_day only changes when target_entry_date genuinely
-- differs from the anchor occurrence's own (pre-edit) entry_date, i.e. the
-- member actually edited the date field.
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

  -- Same series lock as ensure_budget_recurring_occurrences and delete_
  -- recurring_budget_occurrence — acquired before any read/write of the
  -- template or its occurrences, so a concurrent ensure() either completes
  -- fully before this transaction proceeds (and this function then
  -- overwrites what it generated) or blocks until this transaction commits
  -- (and then reads the updated template/occurrences fresh).
  PERFORM pg_advisory_xact_lock(budget_recurring_expense_lock_key(v_recurring_id));

  SELECT category_id, title, amount_cents, kind, note, recurrence_day, start_month, end_month
    INTO v_old_category_id, v_old_title, v_old_amount_cents, v_old_kind, v_old_note,
         v_old_recurrence_day, v_old_start_month, v_old_end_month
    FROM budget_recurring_expenses
    WHERE id = v_recurring_id;

  -- Freeze history: materialize every still-missing month strictly before
  -- the selected one, using the template values as they stood BEFORE this
  -- edit. end_month is included defensively even though a currently-
  -- existing anchor occurrence already implies every month before it is
  -- also before end_month. generate_series naturally produces zero rows
  -- when the anchor month is the series' very first month (start > stop).
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

  -- Only treat this as an explicit day change if the submitted date truly
  -- differs from what the anchor occurrence had before the edit — a date
  -- input merely echoing back a clamped value (e.g. Feb 28 for a day-31
  -- series) must not be mistaken for the member choosing the 28th.
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


-- =============================================================================
-- RPC: stop_recurring_budget_expense_series
-- "Arrêter à partir de ce mois" — sets the series' end_month to the selected
-- occurrence's own entry_month (an EXCLUSIVE boundary, so the selected month
-- itself is included in what gets removed) and deletes every already-
-- materialized occurrence from that month onward, atomically. Historical
-- occurrences before end_month, existing skip tombstones, and the series/
-- template row itself are all left untouched — this stops future
-- generation, it does not delete the series.
--
-- SECURITY DEFINER for the same reason as edit_recurring_budget_expense_
-- series above: budget_recurring_expenses has no UPDATE policy for members,
-- so setting end_month requires bypassing RLS, guarded by the same explicit
-- household-membership check performed before any write.
--
-- Acquires the same series lock as ensure_budget_recurring_occurrences
-- before writing, so the two orderings are both safe:
--   - stop wins the lock first: ensure blocks, then (once stop commits)
--     regenerates nothing at/after end_month, because its generation query
--     now reads the committed end_month.
--   - ensure wins the lock first: stop blocks until ensure commits whatever
--     it was going to generate, then deletes everything at/after end_month
--     that ensure just created — final state is always fully stopped.
-- =============================================================================
CREATE OR REPLACE FUNCTION stop_recurring_budget_expense_series(target_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_recurring_id uuid;
  v_entry_month  date;
BEGIN
  SELECT household_id, recurring_expense_id, entry_month
    INTO v_household_id, v_recurring_id, v_entry_month
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

  PERFORM pg_advisory_xact_lock(budget_recurring_expense_lock_key(v_recurring_id));

  UPDATE budget_recurring_expenses
  SET end_month = v_entry_month
  WHERE id = v_recurring_id;

  DELETE FROM budget_entries
  WHERE recurring_expense_id = v_recurring_id
    AND entry_month >= v_entry_month;
END;
$$;

REVOKE ALL ON FUNCTION stop_recurring_budget_expense_series(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stop_recurring_budget_expense_series(uuid) TO authenticated;
