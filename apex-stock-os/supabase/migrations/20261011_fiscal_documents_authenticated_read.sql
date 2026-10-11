-- The mobile ARCA document reader uses PostgREST as the signed-in merchant.
-- PostgreSQL table privileges are checked BEFORE RLS. Without SELECT,
-- even authorized business members get permission denied (42501).
-- Preserve tenant isolation: only business members may view their records.

do $migration$
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.global_stock_fiscal_documents'::regclass
      and relrowsecurity
  ) then
    raise exception 'Refusing to grant fiscal document reads without RLS';
  end if;
end
$migration$;

grant select on table public.global_stock_fiscal_documents to authenticated;
-- Do not grant reads to anon and do not grant insert/update/delete here.
