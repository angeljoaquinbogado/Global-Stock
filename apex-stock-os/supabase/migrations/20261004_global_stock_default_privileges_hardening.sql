-- Fail closed for future objects exposed through Supabase Data API.
-- Existing object grants and RLS remain governed by their own migrations.
-- Any future client-facing table/function/sequence must receive an explicit
-- least-privilege GRANT in the same migration that introduces it.

begin;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger
  on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;

commit;
