-- Domotidien — Household invitations (issue #70)
--
-- V1 invitation flow: a household admin creates a copyable invite link (no
-- automatic email sending). The invited person opens the link, logs in or
-- signs up, then accepts the invitation to join the same household as a
-- 'member'. A user may belong to only one household at a time (see the
-- unique index on household_members.user_id in household-rpc.sql).
--
-- Apply in the Supabase SQL Editor after schema.sql, grants.sql, and
-- household-rpc.sql. Safe to re-run.

CREATE TABLE IF NOT EXISTS household_invitations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email text        NOT NULL,
  role          text        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token         uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at   timestamptz,
  accepted_by   uuid        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id
  ON household_invitations (household_id);

ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies are defined here, and none should
-- be added later: with RLS enabled and zero matching policies, direct table
-- access is denied to every role, including `authenticated` — the same
-- deny-by-default pattern already used for direct INSERTs on `households`
-- (see household-rpc.sql). All reads and writes go through the SECURITY
-- DEFINER RPCs below, which run as the function owner and therefore bypass
-- RLS. This keeps invited_email addresses and tokens from ever being
-- exposed through an accidental permissive policy, and means no table-level
-- GRANTs are needed for `authenticated` on this table (see grants.sql).


-- Returns invitation details for the invite page (household name, invited
-- email, status) without exposing the household_invitations row directly.
-- Returns no rows when the token doesn't match any invitation.
CREATE OR REPLACE FUNCTION get_household_invitation(invite_token uuid)
RETURNS TABLE (
  household_name text,
  invited_email  text,
  status         text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_inv household_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_inv FROM household_invitations WHERE token = invite_token;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT h.name,
         v_inv.invited_email,
         CASE
           WHEN v_inv.accepted_at IS NOT NULL THEN 'accepted'
           WHEN v_inv.expires_at < now()      THEN 'expired'
           ELSE 'pending'
         END
  FROM households h
  WHERE h.id = v_inv.household_id;
END;
$$;

REVOKE ALL ON FUNCTION get_household_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_household_invitation(uuid) TO authenticated;


-- Creates an invitation for the caller's household. Only the admin of a
-- household may invite new members. Because V1 enforces one household per
-- user, looking up the caller's own admin membership row is enough to find
-- "their" household — no household_id parameter is accepted from the client.
-- The output column is named `email` rather than `invited_email`: PL/pgSQL
-- treats RETURNS TABLE columns as implicit OUT parameters sharing the same
-- namespace as IN parameters, so it can't have the same name as the
-- `invited_email` IN parameter below (Postgres would refuse to create the
-- function with "parameter name used more than once").
CREATE OR REPLACE FUNCTION create_household_invitation(invited_email text)
RETURNS TABLE (
  id            uuid,
  token         uuid,
  household_id  uuid,
  email         text,
  expires_at    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          uuid;
  v_household_id uuid;
  v_email        text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT hm.household_id INTO v_household_id
  FROM household_members hm
  WHERE hm.user_id = v_uid AND hm.role = 'admin';

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Only a household admin can invite members';
  END IF;

  v_email := lower(trim(invited_email));
  IF v_email IS NULL OR v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  RETURN QUERY
  INSERT INTO household_invitations AS hi (household_id, invited_email, created_by)
    VALUES (v_household_id, v_email, v_uid)
    RETURNING hi.id, hi.token, hi.household_id, hi.invited_email, hi.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION create_household_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_household_invitation(text) TO authenticated;


-- Accepts an invitation for the currently authenticated user, adding them to
-- the household as a member. Display identity (name/initial/color) is
-- derived server-side from the auth user's metadata, mirroring the
-- derivation CreateHouseholdForm does client-side for the first (admin)
-- member — an invited member never has to fill in a name/color themselves.
CREATE OR REPLACE FUNCTION accept_household_invitation(invite_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid          uuid;
  v_inv          household_invitations%ROWTYPE;
  v_user_email   text;
  v_user_meta    jsonb;
  v_display_name text;
  v_palette      text[] := ARRAY['#A8623F', '#6E8456', '#5E7790', '#8A7536', '#8A6A82'];
  v_color        text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the invitation row so two concurrent accept calls on the same
  -- token can't both pass the "not already accepted" check below.
  SELECT * INTO v_inv FROM household_invitations WHERE token = invite_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  IF v_inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;

  SELECT email, raw_user_meta_data INTO v_user_email, v_user_meta
  FROM auth.users WHERE id = v_uid;

  IF v_user_email IS NOT NULL AND lower(trim(v_user_email)) <> v_inv.invited_email THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  v_display_name := COALESCE(
    NULLIF(TRIM(v_user_meta ->> 'first_name'), ''),
    NULLIF(TRIM(v_user_meta ->> 'full_name'), ''),
    NULLIF(TRIM(v_user_meta ->> 'name'), ''),
    NULLIF(split_part(v_user_email, '@', 1), ''),
    'Membre'
  );

  -- Deterministic pick from the palette so re-running never changes a
  -- user's color; avoids storing/coordinating color assignment separately.
  v_color := v_palette[1 + (abs((('x' || substr(md5(v_uid::text), 1, 8))::bit(32)::int)::bigint) % array_length(v_palette, 1))::int];

  INSERT INTO household_members (household_id, user_id, role, display_name, initial, color)
  VALUES (v_inv.household_id, v_uid, v_inv.role, v_display_name, upper(left(v_display_name, 1)), v_color);

  UPDATE household_invitations
  SET accepted_at = now(), accepted_by = v_uid
  WHERE id = v_inv.id;

  RETURN v_inv.household_id;
END;
$$;

REVOKE ALL ON FUNCTION accept_household_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_household_invitation(uuid) TO authenticated;
