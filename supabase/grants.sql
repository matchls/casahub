-- CasaHub — Table grants
--
-- When Supabase's automatic table exposure is disabled, PostgreSQL's
-- table-level privileges are not set automatically. RLS policies restrict
-- which rows each role can access, but they only run after the privilege
-- check passes. Both layers must be in place for queries to succeed.
--
-- Apply in the Supabase SQL Editor after schema.sql.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE households       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE household_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE shopping_items   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE events           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notes            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE useful_links     TO authenticated;
