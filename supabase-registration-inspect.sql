-- Read-only: inspect existing columns, policies and grants. No database changes.
SELECT table_schema, column_name, data_type, udt_name, is_nullable, column_default,
       is_identity, identity_generation, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'FlowIn registrations'
ORDER BY table_schema, ordinal_position;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'FlowIn registrations';

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'FlowIn registrations';

SELECT table_schema, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'FlowIn registrations' AND grantee IN ('anon', 'authenticated', 'PUBLIC');
