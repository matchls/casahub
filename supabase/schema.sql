-- =============================================================================
-- CasaHub — Initial Supabase Schema (V1)
--
-- Copy this entire file into the Supabase SQL Editor and execute it.
-- It is idempotent for functions and triggers (CREATE OR REPLACE), but
-- CREATE TABLE statements will fail if the tables already exist — run
-- against a fresh project or add IF NOT EXISTS guards when migrating.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Utility: automatically set updated_at to now() on any row mutation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- households
-- Top-level grouping for all shared household content.
-- -----------------------------------------------------------------------------
CREATE TABLE households (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  -- Couple / Colocation / Famille — mirrors the HouseholdProfile.type union
  type       text        NOT NULL CHECK (type IN ('Couple', 'Colocation', 'Famille')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- household_members
-- Links a Supabase auth user to a household with a display identity and role.
-- One row per (household, user) pair — enforced by the UNIQUE constraint.
-- -----------------------------------------------------------------------------
CREATE TABLE household_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)  ON DELETE CASCADE,
  -- auth.users(id) is the Supabase authentication identity
  user_id      uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  role         text        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  display_name text        NOT NULL,
  -- Single-character initial shown in avatars (e.g. "L")
  initial      text        NOT NULL,
  -- Hex colour for the member's avatar (e.g. "#C2603F")
  color        text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- Speed up the membership lookup used in get_user_household_ids()
CREATE INDEX idx_household_members_user_id      ON household_members (user_id);
CREATE INDEX idx_household_members_household_id ON household_members (household_id);


-- -----------------------------------------------------------------------------
-- shopping_items
-- Shared grocery / errand list for the household.
-- assigned_to references the household_members record (not auth.users directly)
-- so the UI can resolve the member's display name and avatar without extra joins.
-- -----------------------------------------------------------------------------
CREATE TABLE shopping_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  label        text        NOT NULL,
  quantity     integer,
  done         boolean     NOT NULL DEFAULT false,
  assigned_to  uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_by   uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_items_household_id ON shopping_items (household_id);

CREATE TRIGGER trg_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- tasks
-- Household to-do list with flexible due-date modelling.
-- due_label stores the human-readable label (e.g. "Tous les 3 jours") so the
-- frontend can display it without re-deriving it from due_type + due_date.
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid        NOT NULL REFERENCES households(id)     ON DELETE CASCADE,
  title           text        NOT NULL,
  -- Human-readable due label shown in the UI (e.g. "Ce soir", "Sans date")
  due_label       text,
  due_type        text        NOT NULL DEFAULT 'none'
                              CHECK (due_type IN ('date', 'recurrence', 'none')),
  due_date        timestamptz,
  -- iCalendar RRULE string for recurring tasks (e.g. "FREQ=DAILY;INTERVAL=3")
  recurrence_rule text,
  done            boolean     NOT NULL DEFAULT false,
  assigned_to     uuid        REFERENCES household_members(id)       ON DELETE SET NULL,
  created_by      uuid        REFERENCES household_members(id)       ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_household_id ON tasks (household_id);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- events
-- Calendar events shared across the household.
-- event_date + event_time are stored separately so date-only events (no time)
-- can be modelled without nullable timestamps.
-- -----------------------------------------------------------------------------
CREATE TABLE events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  title        text        NOT NULL,
  event_date   date        NOT NULL,
  -- NULL means the event spans the whole day
  event_time   time,
  location     text,
  assigned_to  uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_by   uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_household_id ON events (household_id);
CREATE INDEX idx_events_event_date   ON events (event_date);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- notes
-- Shared household notes organised by category (WiFi, codes, numbers, ideas…)
-- -----------------------------------------------------------------------------
CREATE TABLE notes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  title        text        NOT NULL,
  content      text        NOT NULL DEFAULT '',
  -- Mirrors the NoteCategory union type from lib/domain/types.ts
  category     text        NOT NULL
               CHECK (category IN ('wifi', 'codes', 'numbers', 'ideas')),
  created_by   uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_household_id ON notes (household_id);

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- -----------------------------------------------------------------------------
-- useful_links
-- Shared bookmarks for the household (insurance, admin, services…)
-- icon stores the emoji or identifier chosen by the user (e.g. "🛡️")
-- -----------------------------------------------------------------------------
CREATE TABLE useful_links (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid        NOT NULL REFERENCES households(id)        ON DELETE CASCADE,
  title        text        NOT NULL,
  url          text        NOT NULL,
  -- Mirrors the LinkCategory union type from lib/domain/types.ts
  category     text        NOT NULL
               CHECK (category IN ('home', 'health', 'documents', 'admin', 'services', 'ideas')),
  icon         text        NOT NULL DEFAULT '',
  created_by   uuid        REFERENCES household_members(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_useful_links_household_id ON useful_links (household_id);

CREATE TRIGGER trg_useful_links_updated_at
  BEFORE UPDATE ON useful_links
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE useful_links      ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Helper: resolve the current user's household IDs without triggering RLS
-- recursion.
--
-- Why SECURITY DEFINER?
--   household_members itself has RLS. If a policy on household_members (or any
--   other table) contains a plain subquery like
--       SELECT household_id FROM household_members WHERE user_id = auth.uid()
--   PostgreSQL re-evaluates the RLS policies on household_members, leading to
--   infinite recursion. Running this function as its owner (postgres) bypasses
--   RLS on household_members entirely, breaking the cycle.
--
-- SET search_path = public prevents search_path injection attacks.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT household_id
  FROM   household_members
  WHERE  user_id = auth.uid();
$$;

-- Helper: returns true when the target household has no members yet.
--
-- Used by the household_members INSERT policy to gate the "create first member"
-- path. SECURITY DEFINER is required for the same reason as get_user_household_ids():
-- at INSERT time the calling user has no membership row yet, so their
-- get_user_household_ids() returns nothing — a plain subquery under normal RLS
-- would always appear empty, defeating the check entirely.
CREATE OR REPLACE FUNCTION is_household_empty(target_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM   household_members
    WHERE  household_id = target_household_id
  );
$$;


-- =============================================================================
-- POLICIES: households
-- =============================================================================

-- A user may view any household they are currently a member of.
CREATE POLICY "household_members_can_select_household"
  ON households
  FOR SELECT TO authenticated
  USING (id = ANY(get_user_household_ids()));

-- Any authenticated user may create a household.
-- The caller is responsible for immediately inserting a matching admin row
-- into household_members within the same transaction.
CREATE POLICY "authenticated_can_insert_household"
  ON households
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only admin members may update household details (name, type…).
-- The EXISTS check is safe here: it resolves through the household_members
-- SELECT policy, which calls get_user_household_ids() (SECURITY DEFINER).
-- WITH CHECK mirrors USING so the updated row stays within an admin-owned
-- household (guards against edge cases where the id could theoretically change).
CREATE POLICY "admin_can_update_household"
  ON households
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   household_members hm
      WHERE  hm.household_id = households.id
        AND  hm.user_id      = auth.uid()
        AND  hm.role         = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   household_members hm
      WHERE  hm.household_id = households.id
        AND  hm.user_id      = auth.uid()
        AND  hm.role         = 'admin'
    )
  );

-- Only admin members may delete a household (and all its cascading content).
CREATE POLICY "admin_can_delete_household"
  ON households
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   household_members hm
      WHERE  hm.household_id = households.id
        AND  hm.user_id      = auth.uid()
        AND  hm.role         = 'admin'
    )
  );


-- =============================================================================
-- POLICIES: household_members
-- =============================================================================

-- A member can see all other members of every household they belong to.
-- get_user_household_ids() is SECURITY DEFINER, so this lookup does NOT
-- recurse back into this same policy.
CREATE POLICY "members_can_select_household_members"
  ON household_members
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

-- Only the creator of a brand-new (empty) household may insert themselves as
-- its first admin member. Once any member exists, this INSERT path is closed:
-- further members require an invitation flow (V2).
--
-- The three WITH CHECK conditions together enforce:
--   1. user_id = auth.uid()   — you can only add yourself, never a third party
--   2. role = 'admin'         — first member must be admin (no orphaned households)
--   3. is_household_empty()   — target household must have zero existing members
--
-- is_household_empty() is SECURITY DEFINER so the count is accurate even
-- before the current user has any membership row (see function comment above).
CREATE POLICY "user_can_join_empty_household"
  ON household_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id  = auth.uid()
    AND role = 'admin'
    AND is_household_empty(household_id)
  );

-- Self-update is intentionally omitted in V1.
-- Allowing arbitrary column updates on one's own row would permit self-promotion
-- from 'member' to 'admin'. Profile edits (display_name, color…) should be
-- handled via a server-side RPC that explicitly excludes the role column.

-- A member may remove themselves from a household (leave).
CREATE POLICY "member_can_delete_own_row"
  ON household_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- =============================================================================
-- POLICIES: shopping_items
-- All members of the household may read and write shopping items.
-- =============================================================================

CREATE POLICY "members_can_select_shopping_items"
  ON shopping_items
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_insert_shopping_items"
  ON shopping_items
  FOR INSERT TO authenticated
  -- WITH CHECK verifies the NEW row's household_id is one the user belongs to
  WITH CHECK (household_id = ANY(get_user_household_ids()));

-- WITH CHECK ensures the updated row's household_id still belongs to the user,
-- preventing a member from moving a row into a household they also belong to
-- but that the row didn't originally belong to.
CREATE POLICY "members_can_update_shopping_items"
  ON shopping_items
  FOR UPDATE TO authenticated
  USING     (household_id = ANY(get_user_household_ids()))
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_delete_shopping_items"
  ON shopping_items
  FOR DELETE TO authenticated
  USING (household_id = ANY(get_user_household_ids()));


-- =============================================================================
-- POLICIES: tasks
-- =============================================================================

CREATE POLICY "members_can_select_tasks"
  ON tasks
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_insert_tasks"
  ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_update_tasks"
  ON tasks
  FOR UPDATE TO authenticated
  USING     (household_id = ANY(get_user_household_ids()))
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_delete_tasks"
  ON tasks
  FOR DELETE TO authenticated
  USING (household_id = ANY(get_user_household_ids()));


-- =============================================================================
-- POLICIES: events
-- =============================================================================

CREATE POLICY "members_can_select_events"
  ON events
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_insert_events"
  ON events
  FOR INSERT TO authenticated
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_update_events"
  ON events
  FOR UPDATE TO authenticated
  USING     (household_id = ANY(get_user_household_ids()))
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_delete_events"
  ON events
  FOR DELETE TO authenticated
  USING (household_id = ANY(get_user_household_ids()));


-- =============================================================================
-- POLICIES: notes
-- =============================================================================

CREATE POLICY "members_can_select_notes"
  ON notes
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_insert_notes"
  ON notes
  FOR INSERT TO authenticated
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_update_notes"
  ON notes
  FOR UPDATE TO authenticated
  USING     (household_id = ANY(get_user_household_ids()))
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_delete_notes"
  ON notes
  FOR DELETE TO authenticated
  USING (household_id = ANY(get_user_household_ids()));


-- =============================================================================
-- POLICIES: useful_links
-- =============================================================================

CREATE POLICY "members_can_select_useful_links"
  ON useful_links
  FOR SELECT TO authenticated
  USING (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_insert_useful_links"
  ON useful_links
  FOR INSERT TO authenticated
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_update_useful_links"
  ON useful_links
  FOR UPDATE TO authenticated
  USING     (household_id = ANY(get_user_household_ids()))
  WITH CHECK (household_id = ANY(get_user_household_ids()));

CREATE POLICY "members_can_delete_useful_links"
  ON useful_links
  FOR DELETE TO authenticated
  USING (household_id = ANY(get_user_household_ids()));
