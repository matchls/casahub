-- CasaHub — Household RPC
--
-- Atomic creation of a household + its first admin member.
-- Apply in the Supabase SQL Editor after schema.sql.

CREATE OR REPLACE FUNCTION create_household_with_member(
  household_name      text,
  household_type      text,
  member_display_name text,
  member_initial      text,
  member_color        text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          uuid;
  v_household_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  IF household_type NOT IN ('Couple', 'Colocation', 'Famille') THEN
    RAISE EXCEPTION 'Invalid household_type: %', household_type;
  END IF;

  INSERT INTO households (name, type)
    VALUES (household_name, household_type)
    RETURNING id INTO v_household_id;

  INSERT INTO household_members (household_id, user_id, role, display_name, initial, color)
    VALUES (v_household_id, v_uid, 'admin', member_display_name, member_initial, member_color);

  RETURN v_household_id;
END;
$$;

REVOKE ALL ON FUNCTION create_household_with_member(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_household_with_member(text, text, text, text, text) TO authenticated;
