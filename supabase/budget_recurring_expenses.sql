-- =============================================================================
-- Kasaly — Budget module: monthly recurring expenses (issue #105)
--
-- Adds budget_recurring_expenses (the recurring template/series) and
-- budget_recurring_expense_skips (durable per-month "delete this occurrence
-- only" markers), a nullable budget_entries.recurring_expense_id relation,
-- and the RPCs that create a series + its first occurrence atomically,
-- materialize missing occurrences for a month range on demand, and delete a
-- single occurrence without reviving it on the next generation pass.
--
-- ⚠️ ADDITIVE ONLY — safe to apply while the current production version is
-- still running. Nothing here alters the meaning of existing budget_entries
-- rows: they keep working exactly as before (implicitly "Ponctuelle", since
-- they carry no recurring_expense_id).
--
-- Prerequisite: supabase/budget.sql must already be applied — this file
-- reuses handle_updated_at(), is_household_member() and
-- budget_category_in_household() defined there / in schema.sql.
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- budget_recurring_expenses
-- The template a monthly ("Mensuelle") expense is generated from. Fixe/
-- Variable (kind) and Ponctuelle/Mensuelle (recurrence) are independent
-- concepts (see issue #105) — a row existing here at all IS the "Mensuelle"
-- signal; kind still separately records whether the amount itself is fixed
-- or variable, exactly as it does on a plain budget_entries row.
--
-- recurrence_day is the requested day-of-month (1–31); generation clamps to
-- the target month's actual last day (see budget_recurring_occurrence_date
-- below) so e.g. day 31 lands on Feb 28/29 without special-casing callers.
-- start_month is the first-of-month the series becomes applicable from —
-- occurrences are never generated before it.
--
-- creation_request_id is a client-generated, per-submission-lifecycle UUID
-- (not derived from title/amount/category/month, which would wrongly
-- collide two genuinely identical subscriptions) — see the unique index
-- below and create_recurring_budget_expense's use of it. Defaults to a
-- fresh random value so any insert that doesn't explicitly supply one (e.g.
-- a direct authenticated insert outside the RPC) still gets a value that's
-- never NULL and never collides.
-- -----------------------------------------------------------------------------
CREATE TABLE budget_recurring_expenses (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id          uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  category_id           uuid        REFERENCES budget_categories(id)          ON DELETE SET NULL,
  title                 text        NOT NULL,
  amount_cents          integer     NOT NULL CHECK (amount_cents >= 0),
  kind                  text        NOT NULL DEFAULT 'fixed'
                        CHECK (kind IN ('fixed', 'variable')),
  note                  text,
  recurrence_day        integer     NOT NULL CHECK (recurrence_day BETWEEN 1 AND 31),
  start_month           date        NOT NULL CHECK (start_month = date_trunc('month', start_month)::date),
  created_by            uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  creation_request_id   uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_recurring_expenses_household_id ON budget_recurring_expenses (household_id);
CREATE INDEX idx_budget_recurring_expenses_category_id  ON budget_recurring_expenses (category_id);

-- Request idempotency (issue #105 follow-up): retrying the same client
-- request (e.g. after the response was lost to a network failure) must
-- reuse the series it already created rather than creating a second one.
-- See create_recurring_budget_expense's ON CONFLICT handling below.
CREATE UNIQUE INDEX idx_budget_recurring_expenses_household_request
  ON budget_recurring_expenses (household_id, creation_request_id);

CREATE TRIGGER trg_budget_recurring_expenses_updated_at
  BEFORE UPDATE ON budget_recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- budget_recurring_expense_skips
-- Durable "this series has no occurrence for this month, and never should
-- again" marker. Without this, deleting a generated March row would be
-- indistinguishable from "March was simply never materialized yet" the next
-- time ensure_budget_recurring_occurrences runs, and March would silently
-- come back. One row per (series, month) — the unique constraint is what
-- makes the delete RPC idempotent under retries.
-- -----------------------------------------------------------------------------
CREATE TABLE budget_recurring_expense_skips (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id  uuid        NOT NULL REFERENCES budget_recurring_expenses(id) ON DELETE CASCADE,
  skip_month            date        NOT NULL CHECK (skip_month = date_trunc('month', skip_month)::date),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recurring_expense_id, skip_month)
);

CREATE INDEX idx_budget_recurring_expense_skips_recurring_expense_id
  ON budget_recurring_expense_skips (recurring_expense_id);


-- -----------------------------------------------------------------------------
-- budget_entries.recurring_expense_id
-- Nullable relation from a generated occurrence back to its series. NULL for
-- every pre-existing row and for every plain "Ponctuelle" entry going
-- forward — both are treated as one-off by construction, no backfill needed.
-- ON DELETE CASCADE mirrors "deleting the series takes its occurrences with
-- it"; there is no UI to delete a whole series in this version, so this only
-- matters for future work, not V1 behaviour.
-- -----------------------------------------------------------------------------
ALTER TABLE budget_entries
  ADD COLUMN recurring_expense_id uuid REFERENCES budget_recurring_expenses(id) ON DELETE CASCADE;

CREATE INDEX idx_budget_entries_recurring_expense_id ON budget_entries (recurring_expense_id);

-- Idempotency guarantee (issue #105): a series can have at most one
-- occurrence per month. Partial (not a plain unique constraint) because it
-- must say nothing about the many budget_entries rows where
-- recurring_expense_id IS NULL — those are unrelated one-off entries and
-- must never collide with each other on entry_month alone.
CREATE UNIQUE INDEX idx_budget_entries_recurring_month
  ON budget_entries (recurring_expense_id, entry_month)
  WHERE recurring_expense_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- GUARD: recurring_expense_id is immutable after insert; a recurring
-- occurrence may not change entry_month
-- Issue #105 requires both of these to be enforced invariants, not just UI
-- restrictions:
--   - Moving March's generated row into April would leave March looking
--     unmaterialized (causing it to be regenerated) while also risking a
--     duplicate April occurrence.
--   - The generic update flow must never be able to implicitly convert a
--     plain entry into a recurring occurrence (or vice versa) — that
--     identity is only ever set once, atomically, by
--     create_recurring_budget_expense at INSERT time.
-- A trigger enforces both regardless of which code path performs the UPDATE
-- (direct table update, future RPCs, etc.), unlike an RLS WITH CHECK, which
-- cannot compare NEW against OLD. One-off entries keep their existing
-- ability to move freely between months.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_recurring_budget_entry_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recurring_expense_id IS DISTINCT FROM OLD.recurring_expense_id THEN
    RAISE EXCEPTION 'A budget entry cannot change its recurring series association';
  END IF;
  IF OLD.recurring_expense_id IS NOT NULL AND NEW.entry_month <> OLD.entry_month THEN
    RAISE EXCEPTION 'A recurring occurrence cannot be moved to a different month';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_recurring_budget_entry_update
  BEFORE UPDATE ON budget_entries
  FOR EACH ROW EXECUTE FUNCTION guard_recurring_budget_entry_update();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE budget_recurring_expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_recurring_expense_skips ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- HELPER: budget_recurring_expense_in_household
-- Same shape/purpose as budget_category_in_household in budget.sql: guards
-- budget_entries.recurring_expense_id so a member can't (accidentally or
-- not) attach an entry to a recurring series id from a different household.
-- Not SECURITY DEFINER for the same reason as its category counterpart — the
-- surrounding policy already requires is_household_member(target_household_id),
-- and members already have SELECT on their own household's recurring
-- expenses (policy below), so this can safely run under the caller's own
-- RLS-restricted view.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION budget_recurring_expense_in_household(target_recurring_expense_id uuid, target_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT target_recurring_expense_id IS NULL OR EXISTS (
    SELECT 1
    FROM   budget_recurring_expenses
    WHERE  id           = target_recurring_expense_id
      AND  household_id = target_household_id
  );
$$;


-- -----------------------------------------------------------------------------
-- POLICIES: budget_recurring_expenses
-- INSERT is allowed directly (not just via the create RPC below) because the
-- create RPC intentionally runs SECURITY INVOKER — it relies on these very
-- policies for its safety, rather than bypassing RLS. No UPDATE/DELETE
-- policy exists: "Modifier/Supprimer toute la série" is explicitly out of
-- scope for this version, so the table is create-and-read-only for members.
-- -----------------------------------------------------------------------------
CREATE POLICY "members_can_select_budget_recurring_expenses"
  ON budget_recurring_expenses
  FOR SELECT TO authenticated
  USING (is_household_member(household_id));

CREATE POLICY "members_can_insert_budget_recurring_expenses"
  ON budget_recurring_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    is_household_member(household_id)
    AND budget_category_in_household(category_id, household_id)
  );


-- -----------------------------------------------------------------------------
-- POLICIES: budget_recurring_expense_skips
-- Household-scoped through the parent series (no denormalized household_id
-- column — this table is small and always looked up by series). No UPDATE
-- and no DELETE policy: a skip means "this series/month must never
-- regenerate," permanently — V1 has no "restore occurrence" / "unskip"
-- feature, so members must not be able to remove a skip row once it exists
-- (that would defeat the whole guarantee this table exists to provide).
-- delete_recurring_budget_occurrence only ever needs to INSERT a skip.
-- -----------------------------------------------------------------------------
CREATE POLICY "members_can_select_budget_recurring_expense_skips"
  ON budget_recurring_expense_skips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_recurring_expenses r
      WHERE r.id = recurring_expense_id AND is_household_member(r.household_id)
    )
  );

CREATE POLICY "members_can_insert_budget_recurring_expense_skips"
  ON budget_recurring_expense_skips
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_recurring_expenses r
      WHERE r.id = recurring_expense_id AND is_household_member(r.household_id)
    )
  );


-- -----------------------------------------------------------------------------
-- Extend the existing budget_entries INSERT/UPDATE policies (defined in
-- budget.sql) to also validate recurring_expense_id, the same way they
-- already validate category_id. ALTER POLICY only redefines the check
-- expression — additive, and a no-op for every existing row/call site, since
-- budget_recurring_expense_in_household(NULL, ...) is true and no pre-existing
-- code path ever sets this column.
-- -----------------------------------------------------------------------------
ALTER POLICY "members_can_insert_budget_entries"
  ON budget_entries
  WITH CHECK (
    is_household_member(household_id)
    AND budget_category_in_household(category_id, household_id)
    AND budget_recurring_expense_in_household(recurring_expense_id, household_id)
  );

ALTER POLICY "members_can_update_budget_entries"
  ON budget_entries
  WITH CHECK (
    is_household_member(household_id)
    AND budget_category_in_household(category_id, household_id)
    AND budget_recurring_expense_in_household(recurring_expense_id, household_id)
  );


-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT               ON TABLE budget_recurring_expenses      TO authenticated;
GRANT SELECT, INSERT               ON TABLE budget_recurring_expense_skips TO authenticated;


-- =============================================================================
-- DAY-OF-MONTH HELPER
-- =============================================================================

-- Resolves a recurrence's requested day-of-month against a specific target
-- month, clamping to that month's real last day when the day doesn't exist
-- there (e.g. day 31 in April, or day 29/30/31 in February). Deterministic
-- and pure, so it's IMMUTABLE.
CREATE OR REPLACE FUNCTION budget_recurring_occurrence_date(target_month date, target_day integer)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LEAST(
    target_month + ((target_day - 1) || ' days')::interval,
    (target_month + interval '1 month' - interval '1 day')
  )::date;
$$;


-- =============================================================================
-- RPC: ensure_budget_recurring_occurrences
-- Materializes every missing occurrence, for every recurring series in the
-- household, across [from_month, to_month] — one set-based INSERT, not a
-- month-by-month loop. Safe to call repeatedly (idempotent): the partial
-- unique index on budget_entries plus ON CONFLICT DO NOTHING means calling
-- it twice — or concurrently from two tabs — never creates duplicates.
--
-- Also serialized against delete_recurring_budget_occurrence per series
-- (issue #105 follow-up) — see the FOR UPDATE lock below and the matching
-- comment in that function. Without it, this function could read a
-- pre-delete snapshot (the skip not yet visible) concurrently with a delete
-- that inserts the skip and removes the occurrence, and recreate the very
-- occurrence the delete just removed.
--
-- SECURITY INVOKER (the default — no SECURITY DEFINER): the INSERT below
-- runs as the calling household member, so the existing budget_entries RLS
-- policies (is_household_member(household_id) in their WITH CHECK) are what
-- actually stops this from ever writing into a household the caller doesn't
-- belong to. The explicit is_household_member() check up front exists only
-- to fail fast with a clear error instead of a generic RLS violation.
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
  v_member_id uuid;
BEGIN
  IF NOT is_household_member(target_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF from_month > to_month THEN
    RETURN;
  END IF;

  SELECT id INTO v_member_id
  FROM   household_members
  WHERE  household_id = target_household_id
    AND  user_id      = auth.uid()
  LIMIT 1;

  -- Lock every candidate series for this household before generating,
  -- in a stable id order so two concurrent ensure() calls always acquire
  -- their locks in the same order and can never deadlock against each
  -- other. delete_recurring_budget_occurrence locks exactly one series row
  -- the same way, so whichever transaction (this one, or a concurrent
  -- delete) commits first is authoritative for that series — the other
  -- blocks here until it does, then re-reads the now-committed state in
  -- the INSERT ... SELECT below (a fresh statement-level snapshot under
  -- READ COMMITTED).
  PERFORM 1
  FROM   budget_recurring_expenses
  WHERE  household_id = target_household_id
  ORDER BY id
  FOR UPDATE;

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
  WHERE r.household_id = target_household_id
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
-- RPC: create_recurring_budget_expense
-- Atomically creates the recurring series AND its first occurrence — a
-- single plpgsql function call is one transaction, so a mid-flight network
-- failure can never leave a template without its first occurrence (or vice
-- versa); the client either sees the created entry or sees nothing at all.
--
-- Also idempotent across request retries (issue #105 follow-up), which is a
-- different guarantee from the atomicity above: atomicity alone doesn't
-- stop a client that never saw the (successful) response from retrying and
-- creating a *second* series. target_request_id is a UUID the client
-- generates once per add-form submission lifecycle and keeps stable across
-- retries of that same submission (see BudgetEntryForm) — the ON CONFLICT
-- below means a retry with the same request id reuses the series it already
-- created instead of creating a duplicate, using an atomic
-- INSERT ... ON CONFLICT DO NOTHING RETURNING rather than a check-then-act
-- SELECT-then-INSERT, so two truly concurrent retries can't both race past
-- a plain existence check. Two genuinely separate, identical-looking
-- expenses (e.g. two Netflix subscriptions) still get their own series,
-- because each submission generates its own fresh request id — only a
-- *retry* of the same submission repeats it.
--
-- SECURITY INVOKER: both INSERTs run as the calling member, so
-- budget_recurring_expenses' and budget_entries' own RLS policies enforce
-- household membership and category ownership — this function adds no
-- privilege the caller didn't already have.
--
-- Returns the created (or, on a retried request, the already-existing)
-- budget_entries row (not the series) so the client can feed it straight
-- through the same mapBudgetEntryRow()/optimistic-update path used for a
-- plain Ponctuelle entry, no parallel result shape needed.
-- =============================================================================
CREATE OR REPLACE FUNCTION create_recurring_budget_expense(
  target_household_id    uuid,
  target_category_id     uuid,
  target_title            text,
  target_amount_cents     integer,
  target_kind             text,
  target_note             text,
  target_recurrence_day   integer,
  target_start_month      date,
  target_request_id       uuid
)
RETURNS SETOF budget_entries
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_series_id uuid;
BEGIN
  IF NOT is_household_member(target_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF target_request_id IS NULL THEN
    RAISE EXCEPTION 'target_request_id is required';
  END IF;

  SELECT id INTO v_member_id
  FROM   household_members
  WHERE  household_id = target_household_id
    AND  user_id      = auth.uid()
  LIMIT 1;

  INSERT INTO budget_recurring_expenses (
    household_id, category_id, title, amount_cents, kind, note,
    recurrence_day, start_month, created_by, creation_request_id
  ) VALUES (
    target_household_id, target_category_id, target_title, target_amount_cents,
    target_kind, target_note, target_recurrence_day, target_start_month, v_member_id,
    target_request_id
  )
  ON CONFLICT (household_id, creation_request_id) DO NOTHING
  RETURNING id INTO v_series_id;

  IF v_series_id IS NOT NULL THEN
    -- We won: target_request_id was genuinely new, so this is a fresh
    -- series — create its first occurrence.
    RETURN QUERY
    INSERT INTO budget_entries (
      household_id, category_id, title, amount_cents, entry_date, entry_month,
      kind, note, created_by, recurring_expense_id
    ) VALUES (
      target_household_id,
      target_category_id,
      target_title,
      target_amount_cents,
      budget_recurring_occurrence_date(target_start_month, target_recurrence_day),
      target_start_month,
      target_kind,
      target_note,
      v_member_id,
      v_series_id
    )
    RETURNING *;
    RETURN;
  END IF;

  -- Conflict: this exact request id already created a series (a retried
  -- submission whose earlier response the client never saw). Return the
  -- existing first occurrence instead of creating a duplicate series.
  SELECT id INTO v_series_id
  FROM   budget_recurring_expenses
  WHERE  household_id = target_household_id
    AND  creation_request_id = target_request_id;

  RETURN QUERY
    SELECT * FROM budget_entries
    WHERE  recurring_expense_id = v_series_id
    ORDER BY entry_date
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION create_recurring_budget_expense(uuid, uuid, text, integer, text, text, integer, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_recurring_budget_expense(uuid, uuid, text, integer, text, text, integer, date, uuid) TO authenticated;


-- =============================================================================
-- RPC: delete_recurring_budget_occurrence
-- Atomically registers a durable skip for (series, month) AND deletes the
-- generated row, so the next ensure_budget_recurring_occurrences call for
-- that month is a no-op instead of recreating what was just deleted. Future
-- months are untouched — this never stops the series itself.
--
-- Also serialized against ensure_budget_recurring_occurrences per series
-- (issue #105 follow-up) — see the FOR UPDATE lock below and the matching
-- comment in that function. Locking the same series row before writing the
-- skip/delete means: if this function wins the lock first, a concurrent
-- ensure() blocks until it commits and then correctly sees the skip and
-- does not recreate the occurrence; if ensure() wins first, this function
-- blocks until it commits and then still records the skip and deletes
-- whatever ensure() just (re)created — the final state is always deleted.
--
-- SECURITY INVOKER: the initial SELECT, the lock, the skip INSERT and the
-- final DELETE all run as the calling member — budget_entries'/budget_
-- recurring_expense_skips' own RLS policies are the actual enforcement; the
-- checks below exist to raise a clear error rather than a silent "0 rows
-- affected".
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_recurring_budget_occurrence(target_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
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

  PERFORM 1 FROM budget_recurring_expenses WHERE id = v_recurring_id FOR UPDATE;

  INSERT INTO budget_recurring_expense_skips (recurring_expense_id, skip_month)
  VALUES (v_recurring_id, v_entry_month)
  ON CONFLICT (recurring_expense_id, skip_month) DO NOTHING;

  DELETE FROM budget_entries WHERE id = target_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_recurring_budget_occurrence(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_recurring_budget_occurrence(uuid) TO authenticated;
