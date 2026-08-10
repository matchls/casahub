-- =============================================================================
-- Kasaly — Budget module (V2, issue: household monthly budget)
--
-- Adds budget_categories (2-level: main category + subcategory) and
-- budget_entries, with RLS restricted to household members, plus an
-- idempotent RPC that seeds the default category tree for a household.
--
-- Prerequisite: supabase/schema.sql must already be applied — this file
-- reuses handle_updated_at() and is_household_member() defined there.
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- budget_categories
-- Two-level hierarchy: parent_id NULL = main category, parent_id set = subcategory.
-- Entries may attach to either level (see budget_entries below); UI totals for
-- a main category always include all of its subcategories' entries.
-- -----------------------------------------------------------------------------
CREATE TABLE budget_categories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  parent_id    uuid        REFERENCES budget_categories(id)          ON DELETE CASCADE,
  name         text        NOT NULL,
  icon         text        NOT NULL DEFAULT '',
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_categories_household_id ON budget_categories (household_id);
CREATE INDEX idx_budget_categories_parent_id    ON budget_categories (parent_id);

-- Prevents duplicate default categories across repeated
-- ensure_default_budget_categories() calls (e.g. two tabs opening the Budget
-- page at once). COALESCE maps the "main category" NULL parent_id to a
-- sentinel uuid so NULLs collide instead of each being treated as distinct,
-- which is Postgres's default behaviour for plain unique constraints.
CREATE UNIQUE INDEX idx_budget_categories_unique_name
  ON budget_categories (household_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

CREATE TRIGGER trg_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- budget_entries
-- amount_cents is an integer (never a float) to avoid floating-point rounding
-- drift when summing many entries into category/month totals.
-- entry_month duplicates the first-of-month portion of entry_date as its own
-- column so month views can filter with a plain equality against an indexed
-- column instead of a date_trunc() expression on every query.
-- -----------------------------------------------------------------------------
CREATE TABLE budget_entries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  category_id  uuid        REFERENCES budget_categories(id)          ON DELETE SET NULL,
  title        text        NOT NULL,
  amount_cents integer     NOT NULL CHECK (amount_cents >= 0),
  entry_date   date        NOT NULL,
  entry_month  date        NOT NULL,
  kind         text        NOT NULL DEFAULT 'fixed'
               CHECK (kind IN ('fixed', 'variable')),
  note         text,
  created_by   uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_entries_household_id      ON budget_entries (household_id);
CREATE INDEX idx_budget_entries_category_id       ON budget_entries (category_id);
CREATE INDEX idx_budget_entries_household_month   ON budget_entries (household_id, entry_month);

CREATE TRIGGER trg_budget_entries_updated_at
  BEFORE UPDATE ON budget_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries    ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- POLICIES: budget_categories
-- Read-only for members in this PR. The only writer is the SECURITY DEFINER
-- seeding RPC below, which bypasses RLS as the function owner — custom
-- category management (create/rename/delete) is out of scope for this PR.
-- -----------------------------------------------------------------------------
CREATE POLICY "members_can_select_budget_categories"
  ON budget_categories
  FOR SELECT TO authenticated
  USING (is_household_member(household_id));


-- -----------------------------------------------------------------------------
-- POLICIES: budget_entries
-- -----------------------------------------------------------------------------
CREATE POLICY "members_can_select_budget_entries"
  ON budget_entries
  FOR SELECT TO authenticated
  USING (is_household_member(household_id));

CREATE POLICY "members_can_insert_budget_entries"
  ON budget_entries
  FOR INSERT TO authenticated
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "members_can_update_budget_entries"
  ON budget_entries
  FOR UPDATE TO authenticated
  USING     (is_household_member(household_id))
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "members_can_delete_budget_entries"
  ON budget_entries
  FOR DELETE TO authenticated
  USING (is_household_member(household_id));


-- =============================================================================
-- GRANTS
-- Mirrors supabase/grants.sql — required when Supabase's automatic table
-- exposure is disabled, since RLS policies only run after the table-level
-- privilege check passes.
-- =============================================================================

GRANT SELECT                         ON TABLE budget_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE budget_entries    TO authenticated;


-- =============================================================================
-- DEFAULT CATEGORY SEEDING
-- =============================================================================

-- Idempotent and safe to call every time the Budget page loads:
--   1. Bails out immediately if the household already has any budget
--      category, covering the common "already seeded" case in one query.
--   2. Every INSERT additionally carries ON CONFLICT DO NOTHING against
--      idx_budget_categories_unique_name, so it stays correct even if two
--      requests race past the check above at the same time.
-- SECURITY DEFINER because budget_categories only allows SELECT for members
-- (see policy above) — this function is the one exception allowed to write.
CREATE OR REPLACE FUNCTION ensure_default_budget_categories(target_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_household_member(target_household_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  IF EXISTS (SELECT 1 FROM budget_categories WHERE household_id = target_household_id) THEN
    RETURN;
  END IF;

  -- Main categories
  INSERT INTO budget_categories (household_id, parent_id, name, icon, sort_order)
  VALUES
    (target_household_id, NULL, 'Appartement', '🏠', 0),
    (target_household_id, NULL, 'Nourriture',  '🍽️', 1),
    (target_household_id, NULL, 'Voiture',     '🚗', 2),
    (target_household_id, NULL, 'Trajets',     '🚆', 3),
    (target_household_id, NULL, 'Chien',       '🐶', 4),
    (target_household_id, NULL, 'Autres',      '📦', 5)
  ON CONFLICT (household_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name)
  DO NOTHING;

  -- Subcategories — joined onto their just-inserted (or pre-existing) parent
  -- by name, so no per-category id bookkeeping is needed here.
  INSERT INTO budget_categories (household_id, parent_id, name, icon, sort_order)
  SELECT target_household_id, parent.id, sub.name, sub.icon, sub.sort_order
  FROM (VALUES
    ('Appartement', 'Loyer',                '🏠', 0),
    ('Appartement', 'Électricité',          '⚡', 1),
    ('Appartement', 'Eau',                  '💧', 2),
    ('Appartement', 'Internet',             '📶', 3),
    ('Appartement', 'Assurance habitation', '🛡️', 4),
    ('Appartement', 'Charges',              '🧾', 5),
    ('Appartement', 'Autres',               '📦', 6),

    ('Voiture', 'Assurance',          '🛡️', 0),
    ('Voiture', 'Contrôle technique', '🔧', 1),
    ('Voiture', 'Entretien',          '🛠️', 2),
    ('Voiture', 'Essence',            '⛽', 3),
    ('Voiture', 'Péage',              '🛣️', 4),
    ('Voiture', 'Parking',            '🅿️', 5),
    ('Voiture', 'Autres',             '📦', 6),

    ('Chien', 'Croquettes',  '🦴', 0),
    ('Chien', 'Vétérinaire', '🩺', 1),
    ('Chien', 'Assurance',   '🛡️', 2),
    ('Chien', 'Accessoires', '🎾', 3),
    ('Chien', 'Garde',       '🏡', 4),
    ('Chien', 'Autres',      '📦', 5),

    ('Nourriture', 'Courses',     '🛒', 0),
    ('Nourriture', 'Marché',      '🥕', 1),
    ('Nourriture', 'Restaurants', '🍔', 2),
    ('Nourriture', 'Livraison',   '🚴', 3),
    ('Nourriture', 'Autres',      '📦', 4),

    ('Trajets', 'Essence',              '⛽', 0),
    ('Trajets', 'Péage',                '🛣️', 1),
    ('Trajets', 'Train',                '🚆', 2),
    ('Trajets', 'Transports en commun', '🚌', 3),
    ('Trajets', 'Parking',              '🅿️', 4),
    ('Trajets', 'Autres',               '📦', 5)
  ) AS sub(main_name, name, icon, sort_order)
  JOIN budget_categories parent
    ON parent.household_id = target_household_id
   AND parent.parent_id IS NULL
   AND parent.name = sub.main_name
  ON CONFLICT (household_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name)
  DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION ensure_default_budget_categories(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_default_budget_categories(uuid) TO authenticated;
